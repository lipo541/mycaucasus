"use client";
import React from 'react';
import BasePhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import './phone-input.css';

type Props = {
  value: string | undefined;
  onChange: (v: string | undefined) => void;
  placeholder?: string;
  required?: boolean;
  preferredCountries?: string[];
};

export function PhoneInput({ value, onChange, placeholder = 'ტელეფონი', required, preferredCountries = ['ge','de','fr','ru','tr','az','am'] }: Props) {
  return (
    <div className="login__field">
      <BasePhoneInput
        value={value ?? ''}
        onChange={(v) => onChange(v || undefined)}
        country="ge"
        preferredCountries={preferredCountries}
        enableSearch
        countryCodeEditable={false}
        disableSearchIcon={false}
        placeholder={placeholder}
        containerClass="phone2"
        inputClass="phone2__input"
        buttonClass="phone2__btn"
        dropdownClass="phone2__dropdown"
        searchClass="phone2__search"
        inputProps={{ required, name: 'phone', autoComplete: 'tel' }}
      />
    </div>
  );
}
