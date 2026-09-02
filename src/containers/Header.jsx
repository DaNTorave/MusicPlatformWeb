import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from '../api/apiClient';

import Button from "../components/Button";
import AuthModal from "./AuthModal";
import UploadMusicModal from "../components/UploadMusicModal";

import logo from "../assets/logo.png";
import userIcon from "../assets/user-svgrepo-com.svg";

import "../styles/Header.css";

export default function Header() {
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [user, setUser] = useState(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const currentUser = apiClient.getUser();
        if (currentUser) {
            setUser(currentUser);
        }

        const handleAuthChange = () => {
            const updatedUser = apiClient.getUser();
            setUser(updatedUser);
        };

        window.addEventListener('auth:unauthorized', handleAuthChange);
        window.addEventListener('storage', (e) => {
            if (e.key === 'user' || e.key === 'authToken') {
                handleAuthChange();
            }
        });

        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            window.removeEventListener('auth:unauthorized', handleAuthChange);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleLoginSuccess = () => {
        const currentUser = apiClient.getUser();
        setUser(currentUser);
        setIsAuthModalOpen(false);
        setIsDropdownOpen(false);
    };

    const handleLogout = () => {
        apiClient.clearSession();
        setUser(null);
        setIsDropdownOpen(false);
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        navigate('/');
    };

    const handleProfileClick = () => {
        setIsDropdownOpen(false);
        navigate('/profile');
    };

    const handleUserClick = () => {
        if (user) {
            setIsDropdownOpen(!isDropdownOpen);
        } else {
            setIsAuthModalOpen(true);
        }
    };

    const handleUploadClick = () => {
        setIsDropdownOpen(false);
        setIsUploadModalOpen(true);
    };

    const displayName = user ? (user.nickname || user.login) : null;

    return (
        <>
            <AuthModal 
                isOpen={isAuthModalOpen} 
                onClose={() => setIsAuthModalOpen(false)}
                onLoginSuccess={handleLoginSuccess}
                initialTab="login"
            />

            <UploadMusicModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onSuccess={() => console.log('Контент загружен!')}
            />
            
            <header className="header">
                <div 
                    className="header-title-with-logo-block" 
                    onClick={() => navigate('/')} 
                    style={{ cursor: 'pointer' }}
                >
                    <img className="header-logo" src={logo} alt="Логотип" />
                    <p className="header-title">Music Platform</p>
                </div>
                
                <div className="header-user-block" ref={dropdownRef}>
                    <div className="user-menu-container">
                        <Button 
                            type="button" 
                            variant="user-header"
                            fullWidth={false}
                            onClick={handleUserClick}
                        >
                            <img className="user-icon" src={userIcon} alt="Иконка пользователя" />
                            <span>{user ? displayName : 'Войти'}</span>
                        </Button>
                        
                        {user && isDropdownOpen && (
                            <div className="user-dropdown">
                                <button type="button" className="dropdown-item" onClick={handleProfileClick}>
                                    Профиль
                                </button>

                                {user && (user.role === 'admin' || user.role === 'moderator') && (
                                    <button 
                                        type="button" 
                                        className="dropdown-item" 
                                        onClick={() => {
                                            setIsDropdownOpen(false);
                                            navigate('/moderation');
                                        }}
                                    >
                                        Модерация
                                    </button>
                                )}

                                <div className="dropdown-divider"></div>
                                <button type="button" className="dropdown-item logout" onClick={handleLogout}>
                                    Выйти
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>
        </>
    );
}