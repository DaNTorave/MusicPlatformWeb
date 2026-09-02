import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/apiClient';

import ChangePasswordModal from '../components/ChangePasswordModal';
import ChangeNicknameModal from '../components/ChangeNicknameModal';

import defaultAvatar from '../assets/Шотландская веслоухая.jpg';

import '../styles/ProfilePage.css';

export default function ProfilePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [isOwnProfile, setIsOwnProfile] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [isNicknameModalOpen, setIsNicknameModalOpen] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            setError(null);
            
            try {
                const currentUser = apiClient.getUser();
                let targetId;
                let isOwn = false;

                if (id) {
                    targetId = parseInt(id);
                    if (currentUser && targetId === currentUser.id) {
                        isOwn = true;
                    }
                } else {
                    if (!currentUser) {
                        navigate('/');
                        return;
                    }
                    targetId = currentUser.id;
                    isOwn = true;
                }

                setIsOwnProfile(isOwn);

                let response;
                if (isOwn) {
                    response = await apiClient.request('/api/profile', {
                        method: 'GET',
                        requireAuth: true
                    });
                } else {
                    const token = apiClient.getToken();
                    response = await apiClient.request(`/api/profile/${targetId}`, {
                        method: 'GET',
                        requireAuth: false,
                        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                    });
                }
                
                if (response) {
                    const userData = response.profile || response.user;
                    if (userData) {
                        setUser(userData);
                    } else {
                        setError('Пользователь не найден');
                    }
                }
            } catch (err) {
                console.error('Ошибка загрузки профиля:', err);
                if (err.status === 401) {
                    apiClient.clearSession();
                    navigate('/');
                    return;
                }
                if (err.status === 404) {
                    setError('Пользователь не найден');
                } else {
                    setError(err.message || 'Ошибка загрузки профиля');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [id, navigate]);

    const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    try {
        const res = await apiClient.upload('/api/profile/avatar', formData);
        if (res.user) {
        setUser(prev => ({ ...prev, ...res.user }));
        apiClient.setUser(res.user);
        }
    } catch (err) {
        alert(err.message || 'Ошибка загрузки аватара');
    }
    };

    if (loading) return <div className="profile-loading">Загрузка...</div>;
    if (error) return <div className="profile-error">{error}</div>;
    if (!user) return <div className="profile-not-found">Пользователь не найден</div>;

    return (
        <div className="profile-page">
            <ChangePasswordModal 
                isOpen={isPasswordModalOpen} 
                onClose={() => setIsPasswordModalOpen(false)} 
            />

            <ChangeNicknameModal
                isOpen={isNicknameModalOpen}
                onClose={() => setIsNicknameModalOpen(false)}
                currentNickname={user.nickname}
                onNicknameUpdated={(updatedUser) => {
                    setUser(prev => ({ ...prev, ...updatedUser }));
                }}
            />

            <div className="profile-container">
                <div className="profile-info">
                    <div className="profile-header">
                        <div className="profile-avatar">
                            <img 
                                src={user.avatar && user.avatar.trim() !== '' ? user.avatar : defaultAvatar} 
                                alt={user.nickname || user.login} 
                            />
                        </div>
                        <div className="profile-info">
                            <h1>{user.nickname || user.login}</h1>
                            <p className="profile-login">@{user.login}</p>
                            {isOwnProfile && user.email && <p className="profile-email">{user.email}</p>}
                            <div className="profile-badge">
                                <span className={`role-badge ${user.role || 'member'}`}>{user.role || 'member'}</span>
                                {user.is_premium && <span className="premium-badge">Premium</span>}
                            </div>
                        </div>
                    </div>

                    <div className="profile-details">
                        {!isOwnProfile && (
                            <div className="detail-item">
                                <span className="detail-label">Присоединился</span>
                                <span className="detail-value">
                                    {user.inserted_at ? new Date(user.inserted_at).toLocaleDateString() : '—'}
                                </span>
                            </div>
                        )}
                        {isOwnProfile && (
                            <>
                                <div className="detail-item">
                                    <span className="detail-label">Email</span>
                                    <span className="detail-value">{user.email || '—'}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Дата регистрации</span>
                                    <span className="detail-value">
                                        {user.inserted_at ? new Date(user.inserted_at).toLocaleDateString() : '—'}
                                    </span>
                                </div>
                                <div className="profile-actions">
                                    <label className="profile-action-btn" style={{ cursor: 'pointer', textAlign: 'center' }}>
                                            Изменить аватар
                                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
                                    </label>
                                    <button 
                                        className="profile-action-btn"
                                        onClick={() => setIsNicknameModalOpen(true)}
                                    >
                                        Изменить имя
                                    </button>
                                    <button 
                                        className="profile-action-btn"
                                        onClick={() => setIsPasswordModalOpen(true)}
                                    >
                                        Изменить пароль
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}