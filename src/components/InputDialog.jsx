import { memo, useState, useEffect, useRef } from 'react';
import './InputDialog.css';

const InputDialog = memo(function InputDialog({ isOpen, onClose, onSubmit, title, placeholder, defaultValue = '' }) {
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue);
      // Focus the input when dialog opens
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, defaultValue]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (value.trim()) {
      onSubmit(value.trim());
      setValue('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="input-dialog-overlay" onClick={onClose} />
      <div className="input-dialog">
        <h3>{title}</h3>
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="input-dialog-input"
          />
          <div className="input-dialog-buttons">
            <button type="button" onClick={onClose} className="input-dialog-button-cancel">
              Cancel
            </button>
            <button type="submit" className="input-dialog-button-submit" disabled={!value.trim()}>
              Create
            </button>
          </div>
        </form>
      </div>
    </>
  );
});

export default InputDialog;
