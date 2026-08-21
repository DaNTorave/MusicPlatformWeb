import { useState, useEffect } from "react";
import Button from "../components/Button";
import AuthModal from "./AuthModal";
import { apiClient } from '../api/apiClient';

import "../styles/Header.css";
import logo from "../assets/logo.png";
import userIcon from "../assets/user-svgrepo-com.svg";

export default function Header() {
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [user, setUser] = useState(null);

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

        return () => {
            window.removeEventListener('auth:unauthorized', handleAuthChange);
        };
    }, []);

    const handleLoginSuccess = () => {
        const currentUser = apiClient.getUser();
        setUser(currentUser);
        setIsAuthModalOpen(false);
    };

    const handleLogout = () => {
        apiClient.clearSession();
        setUser(null);
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
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
            
            <header className="header">
                <div className="header-title-with-logo-block">
                    <img className="header-logo" src={logo} alt="Логотип" />
                    <p className="header-title">Music Platform</p>
                </div>
                <div className="header-user-block">
                    {user ? (
                        <Button 
                            type="user-login" 
                            onClick={handleLogout}
                        >
                            <img className="user-icon" src={userIcon} alt="Иконка пользователя" />
                            <p>{displayName}</p>
                        </Button>
                    ) : (
                        <Button 
                            type="user-login" 
                            onClick={() => setIsAuthModalOpen(true)}
                        >
                            <img className="user-icon" src={userIcon} alt="Иконка пользователя" />
                            <p>Войти</p>
                        </Button>
                    )}
                </div>
            </header>
        </>
    );
}