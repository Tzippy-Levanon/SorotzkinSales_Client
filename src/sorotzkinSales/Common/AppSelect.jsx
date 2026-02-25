import React from 'react';
import ReactSelect from 'react-select';

// ─── AppSelect ──────────────────────────────────────────────────────────────
// קומפוננטה גנרית לכל dropdown באתר — עקבית, לא גולשת, עם חיפוש.
// options: [{ value, label }]
// value, onChange, placeholder, disabled, isRtl

const getStyles = () => ({
    control: (base, state) => ({
        ...base,
        minHeight: '38px',
        borderColor: '#d4d9e8',
        borderRadius: '4px',
        boxShadow: 'none',
        backgroundColor: '#ffffff',
        fontFamily: 'inherit',
        fontSize: '0.9rem',
        direction: 'rtl',
        '&:hover': { borderColor: '#b8972a' },
    }),
    menu: (base) => ({
        ...base,
        zIndex: 9999,
        borderRadius: '4px',
        border: '1.5px solid #b8972a',
        boxShadow: '0 6px 24px rgba(0,0,0,0.13)',
        direction: 'rtl',
        minWidth: '100%',
        width: 'max-content',
    }),
    menuList: (base) => ({
        ...base,
        maxHeight: '240px',
        padding: '4px 0',
        overflowX: 'hidden'
    }),
    option: (base, state) => ({
        ...base,
        backgroundColor: state.isSelected || state.isFocused ? '#e4e6ed' : '#ffffff',
        color: state.isSelected ? '#b8972a' : '#1a2035',
        fontWeight: state.isSelected ? 600 : 400,
        fontSize: '0.9rem',
        padding: '9px 14px',
        cursor: 'pointer',
        direction: 'rtl',
        whiteSpace: 'nowrap',
    }),
    placeholder: (base) => ({
        ...base,
        color: '#5a6480'
    }),
    singleValue: (base) => ({
        ...base,
        color: '#1a2035'
    }),
    indicatorSeparator: () => ({
        display: 'none'
    }),
    dropdownIndicator: (base) => ({
        ...base,
        color: '#5a6480'
    }),
    noOptionsMessage: (base) => ({
        ...base,
        direction: 'rtl',
        fontSize: '0.9rem'
    }),
});

const AppSelect = ({
    options = [],
    value,
    onChange,
    placeholder = 'בחר...',
    disabled = false,
    noOptionsMessage = 'אין אפשרויות',
}) => {
    const styles = getStyles();
    const selected = options.find(o => String(o.value) === String(value)) || null;

    return (
        <ReactSelect
            options={options}
            value={selected}
            onChange={opt => onChange(opt ? String(opt.value) : '')}
            placeholder={placeholder}
            isDisabled={disabled}
            styles={styles}
            noOptionsMessage={() => noOptionsMessage}
            isRtl
            menuPortalTarget={document.body}
            menuPosition="fixed"
        />
    );
};

export default AppSelect;
