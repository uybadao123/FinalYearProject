// app/manage-user.tsx
import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ActivityIndicator, Alert, ScrollView,
    TouchableOpacity, Modal, Image, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { auth } from '../src/config/firebase';
import { api } from '../src/api/api';
import { MaterialIcons, Feather, FontAwesome5 } from '@expo/vector-icons';

interface User {
    uid: string;
    email: string;
    full_name: string;
    avatar_url?: string;
    experience_level?: string;
    role: 'admin' | 'content_collaborator' | 'gardener';
}

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
    admin: { label: 'Admin', color: '#E74C3C', bg: '#FDEDEC', icon: 'crown' },
    content_collaborator: { label: 'Collaborator', color: '#F39C12', bg: '#FEF5E7', icon: 'pen-nib' },
    gardener: { label: 'Gardener', color: '#7F8C8D', bg: '#F4F7F6', icon: 'user' }
};

const AVAILABLE_ROLES = ['admin', 'content_collaborator', 'gardener'];

export default function ManageUserScreen() {
    const router = useRouter();
    const user = auth.currentUser;

    // Auth states
    const [isAdmin, setIsAdmin] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    // Users data states
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState({ totalUsers: 0, admins: 0, collaborators: 0, gardeners: 0 });

    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [updatingRoleFor, setUpdatingRoleFor] = useState<string | null>(null);

    // Verify admin on mount
    useEffect(() => {
        if (!user) {
            Alert.alert('Authentication Error', 'You must be logged in');
            router.replace('/(auth)/login');
            return;
        }
        checkAdminStatus();
    }, [user]);

  
    useEffect(() => {
        if (isAdmin) {
            fetchUsers();
        }
    }, [isAdmin]);

    const checkAdminStatus = async () => {
        try {
            const profile = await api.user.getMyProfile();
            const role = typeof profile === 'object' ? profile.role : profile;

            if (role !== 'admin') {
                Alert.alert('Access Denied', 'Admin access required', [
                    { text: 'OK', onPress: () => router.back() }
                ]);
                setIsAdmin(false);
            } else {
                setIsAdmin(true);
            }
        } catch (err) {
            Alert.alert('Error', 'Permission verification failed', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } finally {
            setInitialLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError(null);
            const allUsers = await api.user.getAllUsers();
            const usersData = Array.isArray(allUsers) ? allUsers : [];
            setUsers(usersData);
            calculateStats(usersData);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch users';
            setError(errorMessage);
            console.error('Fetch users error:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const calculateStats = (usersData: User[]) => {
        setStats({
            totalUsers: usersData.length,
            admins: usersData.filter(u => u.role === 'admin').length,
            collaborators: usersData.filter(u => u.role === 'content_collaborator').length,
            gardeners: usersData.filter(u => u.role === 'gardener').length,
        });
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchUsers();
    };

    const handleRoleChange = async (uid: string, newRole: string) => {
        if (newRole === selectedUser?.role) {
            setShowRoleModal(false);
            return;
        }

        setUpdatingRoleFor(uid);
        try {
            await api.user.updateUserRole(uid, newRole);
            setUsers(prevUsers =>
                prevUsers.map(u => u.uid === uid ? { ...u, role: newRole as any } : u)
            );
            calculateStats(users.map(u => u.uid === uid ? { ...u, role: newRole as any } : u));
            setShowRoleModal(false);
            Alert.alert('Success', 'User role updated');
        } catch (err) {
            Alert.alert('Error', 'Failed to update role');
            console.error(err);
        } finally {
            setUpdatingRoleFor(null);
        }
    };

    // Initial loading
    if (initialLoading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#1B5E20" />
                    <Text style={styles.loadingText}>Verifying permissions...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!isAdmin) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.centered}>
                    <MaterialIcons name="lock-outline" size={64} color="#BDC3C7" />
                    <Text style={styles.deniedTitle}>Access Denied</Text>
                    <Text style={styles.deniedMessage}>
                        This feature is only available for system administrators.
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <MaterialIcons name="arrow-back" size={24} color="#2C3E50" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>User Management</Text>
                <View style={styles.backBtnPlaceholder} />
            </View>

            {/* CONTENT */}
            {loading && !refreshing ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#1B5E20" />
                    <Text style={styles.loadingText}>Loading users...</Text>
                </View>
            ) : error ? (
                <View style={styles.centered}>
                    <MaterialIcons name="error-outline" size={48} color="#E74C3C" />
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryBtn} onPress={fetchUsers}>
                        <Text style={styles.retryBtnText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView
                    style={styles.scrollContainer}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            tintColor="#1B5E20"
                        />
                    }
                >
                    {/* STATS */}
                    <View style={styles.statsSection}>
                        <View style={styles.statCard}>
                            <Text style={styles.statValue}>{stats.totalUsers}</Text>
                            <Text style={styles.statLabel}>Total Users</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statValue}>{stats.admins}</Text>
                            <Text style={styles.statLabel}>Admins</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statValue}>{stats.collaborators}</Text>
                            <Text style={styles.statLabel}>Collaborators</Text>
                        </View>
                    </View>

                    {/* USERS LIST */}
                    <View style={styles.listSection}>
                        <Text style={styles.sectionTitle}>Users</Text>
                        {users.length === 0 ? (
                            <View style={styles.emptyState}>
                                <MaterialIcons name="people" size={48} color="#BDC3C7" />
                                <Text style={styles.emptyText}>No users found</Text>
                            </View>
                        ) : (
                            users.map((u) => <UserCard key={u.uid} user={u} isUpdating={updatingRoleFor === u.uid} onPress={() => { setSelectedUser(u); setShowRoleModal(true); }} />)
                        )}
                    </View>

                    {/* INSIGHTS */}
                    {!loading && !error && (
                        <View style={styles.insightsCard}>
                            <Text style={styles.insightsTitle}>System Overview</Text>
                            <View style={styles.insightsGrid}>
                                <InsightItem icon="verified-user" label="Admins" value={stats.admins} color="#E74C3C" />
                                <InsightItem icon="edit-note" label="Collaborators" value={stats.collaborators} color="#F39C12" />
                                <InsightItem icon="people" label="Gardeners" value={stats.gardeners} color="#7F8C8D" />
                            </View>
                        </View>
                    )}

                    <View style={{ height: 20 }} />
                </ScrollView>
            )}

            {/* ROLE MODAL */}
            <Modal visible={showRoleModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Change User Role</Text>
                            <TouchableOpacity onPress={() => setShowRoleModal(false)}>
                                <MaterialIcons name="close" size={24} color="#2C3E50" />
                            </TouchableOpacity>
                        </View>

                        {selectedUser && (
                            <>
                                <View style={styles.userInfoModal}>
                                    <Image
                                        source={{
                                            uri: selectedUser.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUser.email}`,
                                        }}
                                        style={styles.modalUserAvatar}
                                    />
                                    <View style={styles.userInfoText}>
                                        <Text style={styles.userNameModal}>{selectedUser.full_name}</Text>
                                        <Text style={styles.userEmailModal}>{selectedUser.email}</Text>
                                    </View>
                                </View>

                                <Text style={styles.roleSelectLabel}>Select New Role:</Text>
                                <View style={styles.roleOptionsContainer}>
                                    {AVAILABLE_ROLES.map((role) => {
                                        const config = ROLE_CONFIG[role];
                                        const isCurrentRole = role === selectedUser.role;
                                        return (
                                            <TouchableOpacity
                                                key={role}
                                                style={[
                                                    styles.roleOption,
                                                    isCurrentRole && styles.roleOptionSelected,
                                                ]}
                                                onPress={() => handleRoleChange(selectedUser.uid, role)}
                                                disabled={updatingRoleFor === selectedUser.uid}
                                            >
                                                {updatingRoleFor === selectedUser.uid && isCurrentRole ? (
                                                    <ActivityIndicator size="small" color={config.color} />
                                                ) : (
                                                    <>
                                                        <FontAwesome5 name={config.icon} size={18} color={config.color} />
                                                        <Text style={[styles.roleOptionLabel, { color: config.color }]}>
                                                            {config.label}
                                                        </Text>
                                                    </>
                                                )}
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </>
                        )}

                        <TouchableOpacity
                            style={styles.modalCloseBtn}
                            onPress={() => setShowRoleModal(false)}
                            disabled={updatingRoleFor !== null}
                        >
                            <Text style={styles.modalCloseBtnText}>Done</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

// USER CARD COMPONENT
const UserCard: React.FC<{ user: User; isUpdating: boolean; onPress: () => void }> = ({ user, isUpdating, onPress }) => {
    const roleConfig = ROLE_CONFIG[user.role];
    return (
        <TouchableOpacity style={[styles.userCard, isUpdating && styles.userCardUpdating]} onPress={onPress}>
            <Image
                source={{
                    uri: user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`,
                }}
                style={styles.userAvatar}
            />
            <View style={styles.userDetails}>
                <Text style={styles.userName}>{user.full_name}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
                {user.experience_level && <Text style={styles.userExperience}>{user.experience_level}</Text>}
            </View>
            <View style={styles.userRoleContainer}>
                <View style={[styles.roleBadge, { backgroundColor: roleConfig.bg }]}>
                    <FontAwesome5 name={roleConfig.icon} size={12} color={roleConfig.color} />
                    <Text style={[styles.roleBadgeText, { color: roleConfig.color }]}>{roleConfig.label}</Text>
                </View>
                {isUpdating ? (
                    <ActivityIndicator size="small" color="#1B5E20" />
                ) : (
                    <Feather name="chevron-right" size={18} color="#BDC3C7" />
                )}
            </View>
        </TouchableOpacity>
    );
};

// INSIGHT ITEM COMPONENT
const InsightItem: React.FC<{ icon: string; label: string; value: number; color: string }> = ({ icon, label, value, color }) => (
    <View style={styles.insightItem}>
        <View style={[styles.insightIconContainer, { backgroundColor: `${color}15` }]}>
            <MaterialIcons name={icon as any} size={20} color={color} />
        </View>
        <Text style={styles.insightValue}>{value}</Text>
        <Text style={styles.insightLabel}>{label}</Text>
    </View>
);

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FBFCFC',
    },

    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },

    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#7F8C8D',
        fontWeight: '500',
    },

    errorText: {
        marginTop: 12,
        fontSize: 14,
        color: '#E74C3C',
        textAlign: 'center',
        fontWeight: '500',
    },

    retryBtn: {
        marginTop: 20,
        paddingHorizontal: 24,
        paddingVertical: 10,
        backgroundColor: '#1B5E20',
        borderRadius: 12,
    },

    retryBtnText: {
        color: '#fff',
        fontWeight: '700',
    },

    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F3F4',
    },

    backBtn: {
        padding: 8,
    },

    backBtnPlaceholder: {
        width: 40,
    },

    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#2C3E50',
    },

    scrollContainer: {
        flex: 1,
    },

    statsSection: {
        flexDirection: 'row',
        margin: 16,
        gap: 12,
    },

    statCard: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F0F3F4',
    },

    statValue: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1B5E20',
    },

    statLabel: {
        fontSize: 11,
        color: '#BDC3C7',
        marginTop: 6,
        fontWeight: '600',
    },

    listSection: {
        paddingHorizontal: 16,
        marginBottom: 20,
    },

    sectionTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#2C3E50',
        marginBottom: 12,
    },

    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
    },

    emptyText: {
        marginTop: 12,
        fontSize: 14,
        color: '#BDC3C7',
        fontWeight: '500',
    },

    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 14,
        marginBottom: 10,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#F0F3F4',
    },

    userCardUpdating: {
        opacity: 0.6,
    },

    userAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        marginRight: 12,
    },

    userDetails: {
        flex: 1,
    },

    userName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#2C3E50',
    },

    userEmail: {
        fontSize: 12,
        color: '#7F8C8D',
        marginTop: 4,
    },

    userExperience: {
        fontSize: 11,
        color: '#BDC3C7',
        marginTop: 2,
        fontWeight: '500',
    },

    userRoleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },

    roleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 4,
    },

    roleBadgeText: {
        fontSize: 11,
        fontWeight: '700',
    },

    insightsCard: {
        margin: 16,
        padding: 20,
        backgroundColor: '#fff',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#F0F3F4',
    },

    insightsTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#2C3E50',
        marginBottom: 16,
    },

    insightsGrid: {
        flexDirection: 'row',
        gap: 12,
    },

    insightItem: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 12,
    },

    insightIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },

    insightValue: {
        fontSize: 18,
        fontWeight: '800',
        color: '#2C3E50',
    },

    insightLabel: {
        fontSize: 11,
        color: '#BDC3C7',
        marginTop: 4,
        fontWeight: '600',
    },

    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },

    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        maxHeight: '80%',
    },

    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },

    modalTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#2C3E50',
    },

    userInfoModal: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F3F4',
    },

    modalUserAvatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        marginRight: 12,
    },

    userInfoText: {
        flex: 1,
    },

    userNameModal: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2C3E50',
    },

    userEmailModal: {
        fontSize: 13,
        color: '#7F8C8D',
        marginTop: 4,
    },

    roleSelectLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#2C3E50',
        marginBottom: 12,
    },

    roleOptionsContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },

    roleOption: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#F0F3F4',
        backgroundColor: '#FBFCFC',
    },

    roleOptionSelected: {
        borderColor: '#1B5E20',
        backgroundColor: '#E8F5E9',
    },

    roleOptionLabel: {
        fontSize: 11,
        fontWeight: '700',
        marginTop: 6,
    },

    modalCloseBtn: {
        backgroundColor: '#1B5E20',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },

    modalCloseBtnText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '800',
    },

    deniedTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#2C3E50',
        marginTop: 16,
    },

    deniedMessage: {
        fontSize: 14,
        color: '#7F8C8D',
        textAlign: 'center',
        marginTop: 12,
        lineHeight: 20,
    },
});
