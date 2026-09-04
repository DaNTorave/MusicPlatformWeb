import { useState, useEffect } from "react";
import Login from "../components/Login";
import Register from "../components/Register";
import ResetPassword from "../components/ResetPassword";
import "../styles/AuthModal.css";

export default function AuthModal({ isOpen, onClose, onLoginSuccess, initialTab = "login" }) {
    const [activeTab, setActiveTab] = useState(initialTab);
    const [isClosing, setIsClosing] = useState(false);
    const [notification, setNotification] = useState(null);

    useEffect(() => {
        if (isOpen) {
            setActiveTab(initialTab);
        }
    }, [isOpen, initialTab]);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            setIsClosing(false);
            onClose();
        }, 300);
    };

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === "Escape" && isOpen) {
                handleClose();
            }
        };
        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [isOpen]);

    const handleBackgroundClick = (e) => {
        if (e.target === e.currentTarget) {
            handleClose();
        }
    };

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    const showNotification = (msg) => {
        setNotification(msg);
        setTimeout(() => {
            setNotification(null);
        }, 8000);
    };

    const handleSuccess = () => {
        if (onLoginSuccess) {
            onLoginSuccess();
        }
        handleClose();
        window.location.reload();
    };

    if (!isOpen) return null;

    return (
        <div 
            className={`modal-background ${isClosing ? "closing" : ""}`}
            onClick={handleBackgroundClick}
        >
            {notification && (
                <div className="modal-toast-notification">
                    <span>{notification}</span>
                    <button onClick={() => setNotification(null)}>✕</button>
                </div>
            )}

            <div className={`modal-window ${isClosing ? "closing" : ""}`}>
                <div className="modal-window-top-buttons">
                    <button 
                        className={`modal-window-top-button ${activeTab === "login" ? "active" : ""}`}
                        onClick={() => setActiveTab("login")}
                    >
                        Вход
                    </button>
                    <button 
                        className={`modal-window-top-button ${activeTab === "register" ? "active" : ""}`}
                        onClick={() => setActiveTab("register")}
                    >
                        Регистрация
                    </button>
                    {activeTab === "reset" && (
                        <button className="modal-window-top-button active">
                            Сброс пароля
                        </button>
                    )}
                    
                    <button className="modal-close-button" onClick={handleClose}>
                        ✕
                    </button>
                </div>
                
                <div className="modal-window-content">
                    {activeTab === "login" && (
                        <Login 
                            onSuccess={handleSuccess} 
                            onSwitchToRegister={() => setActiveTab("register")}
                            onSwitchToReset={() => setActiveTab("reset")}
                        />
                    )}
                    {activeTab === "register" && (
                        <Register 
                            onSuccess={handleSuccess} 
                            onSwitchToLogin={() => setActiveTab("login")} 
                        />
                    )}
                    {activeTab === "reset" && (
                        <ResetPassword 
                            onSuccess={() => setActiveTab("login")}
                            onSwitchToLogin={() => setActiveTab("login")}
                            onShowNotification={showNotification}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}