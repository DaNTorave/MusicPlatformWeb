import '../styles/button.css'

export default function Button({children = '', type = '', onClick, disabled}) {
    return (
        <button className={`button ${type}`} onClick={onClick} disabled={disabled}>
            {children}
        </button>        
    );
}