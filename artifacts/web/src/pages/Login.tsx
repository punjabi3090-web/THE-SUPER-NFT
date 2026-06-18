import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, ArrowLeft, X, User, Lock, Gift } from "lucide-react";
import { supabase } from "../lib/supabase";

const COUNTRIES = [
  { name: 'United States', code: '+1', flag: '🇺🇸', pattern: /^[2-9][0-9]{9}$/, example: '2125551234' },
  { name: 'United Kingdom', code: '+44', flag: '🇬🇧', pattern: /^7[0-9]{9}$/, example: '7911123456' },
  { name: 'Canada', code: '+1', flag: '🇨🇦', pattern: /^[2-9][0-9]{9}$/, example: '4165551234' },
  { name: 'Australia', code: '+61', flag: '🇦🇺', pattern: /^4[0-9]{8}$/, example: '412345678' },
  { name: 'UAE', code: '+971', flag: '🇦🇪', pattern: /^5[0-9]{8}$/, example: '501234567' },
  { name: 'Saudi Arabia', code: '+966', flag: '🇸🇦', pattern: /^5[0-9]{8}$/, example: '512345678' },
  { name: 'Germany', code: '+49', flag: '🇩🇪', pattern: /^1[5-7][0-9]{8,9}$/, example: '1512345678' },
  { name: 'France', code: '+33', flag: '🇫🇷', pattern: /^[67][0-9]{8}$/, example: '612345678' },
  { name: 'Turkey', code: '+90', flag: '🇹🇷', pattern: /^5[0-9]{9}$/, example: '5123456789' },
  { name: 'Pakistan', code: '+92', flag: '🇵🇰', pattern: /^3[0-9]{9}$/, example: '3001234567' },
  { name: 'India', code: '+91', flag: '🇮🇳', pattern: /^[6-9][0-9]{9}$/, example: '9876543210' },
  { name: 'Bangladesh', code: '+880', flag: '🇧🇩', pattern: /^1[3-9][0-9]{8}$/, example: '1712345678' },
  { name: 'China', code: '+86', flag: '🇨🇳', pattern: /^1[3-9][0-9]{9}$/, example: '13812345678' },
  { name: 'Japan', code: '+81', flag: '🇯🇵', pattern: /^[789]0[0-9]{8}$/, example: '9012345678' },
  { name: 'South Korea', code: '+82', flag: '🇰🇷', pattern: /^1[0-9]{8,9}$/, example: '1012345678' },
  { name: 'Russia', code: '+7', flag: '🇷🇺', pattern: /^9[0-9]{9}$/, example: '9123456789' },
  { name: 'Brazil', code: '+55', flag: '🇧🇷', pattern: /^[1-9]{2}9[0-9]{8}$/, example: '11987654321' },
  { name: 'Mexico', code: '+52', flag: '🇲🇽', pattern: /^1[0-9]{10}$/, example: '15512345678' },
  { name: 'Italy', code: '+39', flag: '🇮🇹', pattern: /^3[0-9]{9}$/, example: '3123456789' },
  { name: 'Spain', code: '+34', flag: '🇪🇸', pattern: /^[67][0-9]{8}$/, example: '612345678' },
  { name: 'Afghanistan', code: '+93', flag: '🇦🇫', pattern: /^7[0-9]{8}$/, example: '701234567' },
  { name: 'Albania', code: '+355', flag: '🇦🇱', pattern: /^6[0-9]{8}$/, example: '612345678' },
  { name: 'Algeria', code: '+213', flag: '🇩🇿', pattern: /^[5-7][0-9]{8}$/, example: '512345678' },
  { name: 'Andorra', code: '+376', flag: '🇦🇩', pattern: /^[346][0-9]{5}$/, example: '312345' },
  { name: 'Angola', code: '+244', flag: '🇦🇴', pattern: /^9[0-9]{8}$/, example: '912345678' },
  { name: 'Argentina', code: '+54', flag: '🇦🇷', pattern: /^9[0-9]{10}$/, example: '91123456789' },
  { name: 'Armenia', code: '+374', flag: '🇦🇲', pattern: /^[4-9][0-9]{7}$/, example: '91234567' },
  { name: 'Austria', code: '+43', flag: '🇦🇹', pattern: /^6[0-9]{9,10}$/, example: '6641234567' },
  { name: 'Azerbaijan', code: '+994', flag: '🇦🇿', pattern: /^[45][0-9]{8}$/, example: '501234567' },
  { name: 'Bahrain', code: '+973', flag: '🇧🇭', pattern: /^[36][0-9]{7}$/, example: '36012345' },
  { name: 'Belarus', code: '+375', flag: '🇧🇾', pattern: /^[1-9][0-9]{8}$/, example: '291234567' },
  { name: 'Belgium', code: '+32', flag: '🇧🇪', pattern: /^4[0-9]{8}$/, example: '412345678' },
  { name: 'Belize', code: '+501', flag: '🇧🇿', pattern: /^[67][0-9]{6}$/, example: '6123456' },
  { name: 'Benin', code: '+229', flag: '🇧🇯', pattern: /^[4-9][0-9]{7}$/, example: '90123456' },
  { name: 'Bhutan', code: '+975', flag: '🇧🇹', pattern: /^17[0-9]{6}$/, example: '17123456' },
  { name: 'Bolivia', code: '+591', flag: '🇧🇴', pattern: /^[67][0-9]{7}$/, example: '71234567' },
  { name: 'Bosnia', code: '+387', flag: '🇧🇦', pattern: /^6[0-9]{7}$/, example: '61234567' },
  { name: 'Botswana', code: '+267', flag: '🇧🇼', pattern: /^7[0-9]{7}$/, example: '71234567' },
  { name: 'Brunei', code: '+673', flag: '🇧🇳', pattern: /^[78][0-9]{6}$/, example: '7123456' },
  { name: 'Bulgaria', code: '+359', flag: '🇧🇬', pattern: /^[87-9][0-9]{7,8}$/, example: '871234567' },
  { name: 'Burkina Faso', code: '+226', flag: '🇧🇫', pattern: /^[67][0-9]{7}$/, example: '70123456' },
  { name: 'Burundi', code: '+257', flag: '🇧🇮', pattern: /^[67][0-9]{7}$/, example: '71234567' },
  { name: 'Cambodia', code: '+855', flag: '🇰🇭', pattern: /^[1-9][0-9]{7,8}$/, example: '12345678' },
  { name: 'Cameroon', code: '+237', flag: '🇨🇲', pattern: /^6[0-9]{8}$/, example: '612345678' },
  { name: 'Cape Verde', code: '+238', flag: '🇨🇻', pattern: /^9[0-9]{6}$/, example: '9123456' },
  { name: 'Central African Rep', code: '+236', flag: '🇨🇫', pattern: /^[67][0-9]{7}$/, example: '70123456' },
  { name: 'Chad', code: '+235', flag: '🇹🇩', pattern: /^[67][0-9]{7}$/, example: '60123456' },
  { name: 'Chile', code: '+56', flag: '🇨🇱', pattern: /^9[0-9]{8}$/, example: '912345678' },
  { name: 'Colombia', code: '+57', flag: '🇨🇴', pattern: /^3[0-9]{9}$/, example: '3123456789' },
  { name: 'Comoros', code: '+269', flag: '🇰🇲', pattern: /^[367][0-9]{6}$/, example: '3212345' },
  { name: 'Congo', code: '+242', flag: '🇨🇬', pattern: /^[0-9]{9}$/, example: '061234567' },
  { name: 'Costa Rica', code: '+506', flag: '🇨🇷', pattern: /^[6-8][0-9]{7}$/, example: '81234567' },
  { name: 'Croatia', code: '+385', flag: '🇭🇷', pattern: /^9[0-9]{8}$/, example: '912345678' },
  { name: 'Cuba', code: '+53', flag: '🇨🇺', pattern: /^5[0-9]{7}$/, example: '51234567' },
  { name: 'Cyprus', code: '+357', flag: '🇨🇾', pattern: /^9[0-9]{7}$/, example: '96123456' },
  { name: 'Czech Republic', code: '+420', flag: '🇨🇿', pattern: /^[67][0-9]{8}$/, example: '601234567' },
  { name: 'Denmark', code: '+45', flag: '🇩🇰', pattern: /^[2-9][0-9]{7}$/, example: '21234567' },
  { name: 'Djibouti', code: '+253', flag: '🇩🇯', pattern: /^77[0-9]{6}$/, example: '77123456' },
  { name: 'Dominican Rep', code: '+1', flag: '🇩🇴', pattern: /^[89][0-9]{9}$/, example: '8091234567' },
  { name: 'Ecuador', code: '+593', flag: '🇪🇨', pattern: /^9[0-9]{8}$/, example: '991234567' },
  { name: 'Egypt', code: '+20', flag: '🇪🇬', pattern: /^1[0-9]{9}$/, example: '1001234567' },
  { name: 'El Salvador', code: '+503', flag: '🇸🇻', pattern: /^[67][0-9]{7}$/, example: '71234567' },
  { name: 'Equatorial Guinea', code: '+240', flag: '🇬🇶', pattern: /^[25][0-9]{8}$/, example: '222123456' },
  { name: 'Eritrea', code: '+291', flag: '🇪🇷', pattern: /^[17][0-9]{6}$/, example: '7123456' },
  { name: 'Estonia', code: '+372', flag: '🇪🇪', pattern: /^[5-8][0-9]{6,7}$/, example: '51234567' },
  { name: 'Eswatini', code: '+268', flag: '🇸🇿', pattern: /^[67][0-9]{7}$/, example: '76123456' },
  { name: 'Ethiopia', code: '+251', flag: '🇪🇹', pattern: /^9[0-9]{8}$/, example: '911234567' },
  { name: 'Fiji', code: '+679', flag: '🇫🇯', pattern: /^[7-9][0-9]{6}$/, example: '7123456' },
  { name: 'Finland', code: '+358', flag: '🇫🇮', pattern: /^[4-5][0-9]{7,9}$/, example: '412345678' },
  { name: 'Gabon', code: '+241', flag: '🇬🇦', pattern: /^[06][0-9]{7}$/, example: '06123456' },
  { name: 'Gambia', code: '+220', flag: '🇬🇲', pattern: /^[0-9]{6}$/, example: '3012345' },
  { name: 'Georgia', code: '+995', flag: '🇬🇪', pattern: /^5[0-9]{8}$/, example: '555123456' },
  { name: 'Ghana', code: '+233', flag: '🇬🇭', pattern: /^[25][0-9]{8}$/, example: '201234567' },
  { name: 'Greece', code: '+30', flag: '🇬🇷', pattern: /^69[0-9]{8}$/, example: '6912345678' },
  { name: 'Guatemala', code: '+502', flag: '🇬🇹', pattern: /^[3-5][0-9]{7}$/, example: '51234567' },
  { name: 'Guinea', code: '+224', flag: '🇬🇳', pattern: /^6[0-9]{8}$/, example: '601234567' },
  { name: 'Guyana', code: '+592', flag: '🇬🇾', pattern: /^6[0-9]{6}$/, example: '6123456' },
  { name: 'Haiti', code: '+509', flag: '🇭🇹', pattern: /^[34][0-9]{7}$/, example: '31234567' },
  { name: 'Honduras', code: '+504', flag: '🇭🇳', pattern: /^[389][0-9]{7}$/, example: '91234567' },
  { name: 'Hong Kong', code: '+852', flag: '🇭🇰', pattern: /^[5-9][0-9]{7}$/, example: '51234567' },
  { name: 'Hungary', code: '+36', flag: '🇭🇺', pattern: /^[2-7][0-9]{8}$/, example: '201234567' },
  { name: 'Iceland', code: '+354', flag: '🇮🇸', pattern: /^[6-8][0-9]{6}$/, example: '6123456' },
  { name: 'Indonesia', code: '+62', flag: '🇮🇩', pattern: /^8[1-9][0-9]{7,10}$/, example: '8123456789' },
  { name: 'Iran', code: '+98', flag: '🇮🇷', pattern: /^9[0-9]{9}$/, example: '9123456789' },
  { name: 'Iraq', code: '+964', flag: '🇮🇶', pattern: /^7[0-9]{9}$/, example: '7911234567' },
  { name: 'Ireland', code: '+353', flag: '🇮🇪', pattern: /^8[0-9]{8}$/, example: '851234567' },
  { name: 'Israel', code: '+972', flag: '🇮🇱', pattern: /^5[0-9]{8}$/, example: '501234567' },
  { name: 'Ivory Coast', code: '+225', flag: '🇨🇮', pattern: /^[0-9]{10}$/, example: '0123456789' },
  { name: 'Jamaica', code: '+1', flag: '🇯🇲', pattern: /^[89][0-9]{9}$/, example: '8761234567' },
  { name: 'Jordan', code: '+962', flag: '🇯🇴', pattern: /^7[0-9]{8}$/, example: '791234567' },
  { name: 'Kazakhstan', code: '+7', flag: '🇰🇿', pattern: /^7[0-9]{9}$/, example: '7123456789' },
  { name: 'Kenya', code: '+254', flag: '🇰🇪', pattern: /^7[0-9]{8}$/, example: '712345678' },
  { name: 'Kuwait', code: '+965', flag: '🇰🇼', pattern: /^[569][0-9]{7}$/, example: '51234567' },
  { name: 'Kyrgyzstan', code: '+996', flag: '🇰🇬', pattern: /^[5-7][0-9]{8}$/, example: '551123456' },
  { name: 'Laos', code: '+856', flag: '🇱🇦', pattern: /^20[0-9]{8}$/, example: '2012345678' },
  { name: 'Latvia', code: '+371', flag: '🇱🇻', pattern: /^2[0-9]{7}$/, example: '21234567' },
  { name: 'Lebanon', code: '+961', flag: '🇱🇧', pattern: /^[37][0-9]{7}$/, example: '71123456' },
  { name: 'Lesotho', code: '+266', flag: '🇱🇸', pattern: /^[5-6][0-9]{7}$/, example: '51234567' },
  { name: 'Liberia', code: '+231', flag: '🇱🇷', pattern: /^[45][0-9]{7,8}$/, example: '41234567' },
  { name: 'Libya', code: '+218', flag: '🇱🇾', pattern: /^9[0-9]{8}$/, example: '911234567' },
  { name: 'Lithuania', code: '+370', flag: '🇱🇹', pattern: /^6[0-9]{7}$/, example: '61234567' },
  { name: 'Luxembourg', code: '+352', flag: '🇱🇺', pattern: /^6[0-9]{8}$/, example: '612345678' },
  { name: 'Madagascar', code: '+261', flag: '🇲🇬', pattern: /^3[0-9]{8}$/, example: '321234567' },
  { name: 'Malawi', code: '+265', flag: '🇲🇼', pattern: /^[89][0-9]{8}$/, example: '881234567' },
  { name: 'Malaysia', code: '+60', flag: '🇲🇾', pattern: /^1[0-9]{8,9}$/, example: '123456789' },
  { name: 'Maldives', code: '+960', flag: '🇲🇻', pattern: /^[79][0-9]{6}$/, example: '7123456' },
  { name: 'Mali', code: '+223', flag: '🇲🇱', pattern: /^[67][0-9]{7}$/, example: '60123456' },
  { name: 'Malta', code: '+356', flag: '🇲🇹', pattern: /^7[0-9]{7}$/, example: '71234567' },
  { name: 'Mauritania', code: '+222', flag: '🇲🇷', pattern: /^[2-4][0-9]{7}$/, example: '21234567' },
  { name: 'Mauritius', code: '+230', flag: '🇲🇺', pattern: /^5[0-9]{7}$/, example: '51234567' },
  { name: 'Moldova', code: '+373', flag: '🇲🇩', pattern: /^6[0-9]{7}$/, example: '61234567' },
  { name: 'Monaco', code: '+377', flag: '🇲🇨', pattern: /^[46][0-9]{7,8}$/, example: '612345678' },
  { name: 'Mongolia', code: '+976', flag: '🇲🇳', pattern: /^[5-9][0-9]{7}$/, example: '88123456' },
  { name: 'Montenegro', code: '+382', flag: '🇲🇪', pattern: /^6[0-9]{7,8}$/, example: '67123456' },
  { name: 'Morocco', code: '+212', flag: '🇲🇦', pattern: /^[67][0-9]{8}$/, example: '612345678' },
  { name: 'Mozambique', code: '+258', flag: '🇲🇿', pattern: /^8[0-9]{8}$/, example: '821234567' },
  { name: 'Myanmar', code: '+95', flag: '🇲🇲', pattern: /^9[0-9]{7,9}$/, example: '912345678' },
  { name: 'Namibia', code: '+264', flag: '🇳🇦', pattern: /^81[0-9]{7}$/, example: '811234567' },
  { name: 'Nepal', code: '+977', flag: '🇳🇵', pattern: /^9[0-9]{9}$/, example: '9812345678' },
  { name: 'Netherlands', code: '+31', flag: '🇳🇱', pattern: /^6[0-9]{8}$/, example: '612345678' },
  { name: 'New Zealand', code: '+64', flag: '🇳🇿', pattern: /^2[0-9]{8,9}$/, example: '211234567' },
  { name: 'Nicaragua', code: '+505', flag: '🇳🇮', pattern: /^[578][0-9]{7}$/, example: '81234567' },
  { name: 'Niger', code: '+227', flag: '🇳🇪', pattern: /^[89][0-9]{7}$/, example: '90123456' },
  { name: 'Nigeria', code: '+234', flag: '🇳🇬', pattern: /^[789][01][0-9]{8}$/, example: '8012345678' },
  { name: 'North Macedonia', code: '+389', flag: '🇲🇰', pattern: /^7[0-9]{7}$/, example: '71234567' },
  { name: 'Norway', code: '+47', flag: '🇳🇴', pattern: /^[49][0-9]{7}$/, example: '41234567' },
  { name: 'Oman', code: '+968', flag: '🇴🇲', pattern: /^9[0-9]{7}$/, example: '91234567' },
  { name: 'Palestine', code: '+970', flag: '🇵🇸', pattern: /^5[0-9]{8}$/, example: '591234567' },
  { name: 'Panama', code: '+507', flag: '🇵🇦', pattern: /^6[0-9]{7}$/, example: '61234567' },
  { name: 'Papua New Guinea', code: '+675', flag: '🇵🇬', pattern: /^7[0-9]{7}$/, example: '71234567' },
  { name: 'Paraguay', code: '+595', flag: '🇵🇾', pattern: /^9[0-9]{8}$/, example: '961234567' },
  { name: 'Peru', code: '+51', flag: '🇵🇪', pattern: /^9[0-9]{8}$/, example: '912345678' },
  { name: 'Philippines', code: '+63', flag: '🇵🇭', pattern: /^9[0-9]{9}$/, example: '9171234567' },
  { name: 'Poland', code: '+48', flag: '🇵🇱', pattern: /^[4-9][0-9]{8}$/, example: '512345678' },
  { name: 'Portugal', code: '+351', flag: '🇵🇹', pattern: /^9[0-9]{8}$/, example: '912345678' },
  { name: 'Qatar', code: '+974', flag: '🇶🇦', pattern: /^[35-7][0-9]{7}$/, example: '51234567' },
  { name: 'Romania', code: '+40', flag: '🇷🇴', pattern: /^7[0-9]{8}$/, example: '712345678' },
  { name: 'Rwanda', code: '+250', flag: '🇷🇼', pattern: /^7[0-9]{8}$/, example: '781234567' },
  { name: 'Senegal', code: '+221', flag: '🇸🇳', pattern: /^7[0-9]{8}$/, example: '701234567' },
  { name: 'Serbia', code: '+381', flag: '🇷🇸', pattern: /^6[0-9]{7,8}$/, example: '601234567' },
  { name: 'Sierra Leone', code: '+232', flag: '🇸🇱', pattern: /^[2-8][0-9]{7}$/, example: '30123456' },
  { name: 'Singapore', code: '+65', flag: '🇸🇬', pattern: /^[89][0-9]{7}$/, example: '81234567' },
  { name: 'Slovakia', code: '+421', flag: '🇸🇰', pattern: /^9[0-9]{8}$/, example: '912345678' },
  { name: 'Slovenia', code: '+386', flag: '🇸🇮', pattern: /^[3-7][0-9]{7}$/, example: '31234567' },
  { name: 'Somalia', code: '+252', flag: '🇸🇴', pattern: /^[6-7][0-9]{7,8}$/, example: '612345678' },
  { name: 'South Africa', code: '+27', flag: '🇿🇦', pattern: /^[6-8][0-9]{8}$/, example: '721234567' },
  { name: 'Sri Lanka', code: '+94', flag: '🇱🇰', pattern: /^7[0-9]{8}$/, example: '712345678' },
  { name: 'Sudan', code: '+249', flag: '🇸🇩', pattern: /^9[0-9]{8}$/, example: '912345678' },
  { name: 'Sweden', code: '+46', flag: '🇸🇪', pattern: /^7[0-9]{8}$/, example: '712345678' },
  { name: 'Switzerland', code: '+41', flag: '🇨🇭', pattern: /^7[0-9]{8}$/, example: '781234567' },
  { name: 'Syria', code: '+963', flag: '🇸🇾', pattern: /^9[0-9]{8}$/, example: '912345678' },
  { name: 'Taiwan', code: '+886', flag: '🇹🇼', pattern: /^9[0-9]{8}$/, example: '912345678' },
  { name: 'Tajikistan', code: '+992', flag: '🇹🇯', pattern: /^9[0-9]{8}$/, example: '911234567' },
  { name: 'Tanzania', code: '+255', flag: '🇹🇿', pattern: /^[67][0-9]{8}$/, example: '712345678' },
  { name: 'Thailand', code: '+66', flag: '🇹🇭', pattern: /^[689][0-9]{8}$/, example: '812345678' },
  { name: 'Togo', code: '+228', flag: '🇹🇬', pattern: /^9[0-9]{7}$/, example: '90123456' },
  { name: 'Tunisia', code: '+216', flag: '🇹🇳', pattern: /^[2-9][0-9]{7}$/, example: '20123456' },
  { name: 'Turkmenistan', code: '+993', flag: '🇹🇲', pattern: /^6[0-9]{7}$/, example: '61234567' },
  { name: 'Uganda', code: '+256', flag: '🇺🇬', pattern: /^7[0-9]{8}$/, example: '712345678' },
  { name: 'Ukraine', code: '+380', flag: '🇺🇦', pattern: /^[3-9][0-9]{8}$/, example: '501234567' },
  { name: 'Uruguay', code: '+598', flag: '🇺🇾', pattern: /^9[0-9]{7}$/, example: '91234567' },
  { name: 'Uzbekistan', code: '+998', flag: '🇺🇿', pattern: /^9[0-9]{8}$/, example: '901234567' },
  { name: 'Venezuela', code: '+58', flag: '🇻🇪', pattern: /^4[0-9]{9}$/, example: '4123456789' },
  { name: 'Vietnam', code: '+84', flag: '🇻🇳', pattern: /^[3-9][0-9]{8}$/, example: '912345678' },
  { name: 'Yemen', code: '+967', flag: '🇾🇪', pattern: /^7[0-9]{8}$/, example: '712345678' },
  { name: 'Zambia', code: '+260', flag: '🇿🇲', pattern: /^9[0-9]{8}$/, example: '971234567' },
  { name: 'Zimbabwe', code: '+263', flag: '🇿🇼', pattern: /^7[0-9]{8}$/, example: '712345678' },
];
type PageState = "register" | "register_otp" | "login";

const BRAND = { red: "#DC2626", blue: "#1E3A8A", bg: "#F8F9FA" };

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-bold text-base" style={{ color: BRAND.blue }}>{title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors" style={{ color: BRAND.red }}>
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4 text-sm text-gray-600 leading-relaxed space-y-3">
          {children}
        </div>
        <div className="px-5 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl font-bold text-white text-sm"
            style={{ background: BRAND.red }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const [page, setPage] = useState<PageState>("register");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [form, setForm] = useState({
fullName: '', email: '', confirmEmail: '', password: '',
confirmPassword: '', countryCode: '+1', phone: '', referralCode: '',
acceptTerms: false
}); 
  const [otpCode, setOtpCode] = useState("");

  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get('ref');
    if (ref) {
      setForm(f => ({ ...f, referralCode: ref }));
      sessionStorage.setItem('pending_referral_code', ref);
    }
  }, []);

  const showMsg = (text: string, type = "error") => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: "", type: "" }), 4000);
  };

  const handleSendOtp = async () => {
    if (!form.fullName.trim()) return showMsg("Enter your full name");
    if (!form.email || form.email !== form.confirmEmail) return showMsg("Emails do not match");
    if (form.password !== form.confirmPassword) return showMsg("Passwords do not match");
    if (form.password.length < 6) return showMsg("Password must be at least 6 characters");
    if (!form.acceptTerms) return showMsg("Please agree to Terms & Conditions");

    setLoading(true);

    const refCode = form.referralCode.trim().toUpperCase() ||
      sessionStorage.getItem('pending_referral_code') || '';

    let authData = null;
    let signupError: Error | { message: string; code?: string } | null = null;

    try {
  const result = await supabase.auth.signUp({
    email: form.email.trim().toLowerCase(),
    password: form.password,
    options: {
      data: {
  full_name: form.fullName.trim(),
  phone: form.phone ? `${form.countryCode}${form.phone.trim()}` : '',
  referred_by: refCode || null
}
    }
  });
      authData = result.data;
      signupError = result.error;
    } catch (err) {
      signupError = err as Error;
    }
if (signupError) {
  setLoading(false);
  console.log('Full Signup Error:', signupError);
  return;
    }

      if (!authData || !authData.user) {
    setLoading(false);
    showMsg("Registration failed. Please try again.");
    return;
  }

  if (authData.session) {
  setLoading(false);
  sessionStorage.removeItem('pending_referral_code');
  showMsg("Account created successfully!", "success");
  window.location.replace('/');
  } else {
    // Email confirmation required - wait for OTP
    setLoading(false);
    setPage("register_otp");
    showMsg("6-digit OTP sent to your email", "success");
  }
}
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) return showMsg("Enter the 6-digit OTP");
    setLoading(true);

    const { data: authData, error: verifyError } = await supabase.auth.verifyOtp({
      email: form.email.trim().toLowerCase(),
      token: otpCode,
      type: 'signup',
    });

    if (verifyError || !authData.user) {
      showMsg("Invalid or expired OTP. Please try again.");
      setLoading(false);
      return;
    }

       const refCode = form.referralCode.trim().toUpperCase() || 
      sessionStorage.getItem('pending_referral_code') || '';
 
    setLoading(false);
sessionStorage.removeItem('pending_referral_code');
    showMsg("Account created successfully!", "success");
    window.location.replace('/');
  };


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: form.email.trim().toLowerCase(),
      password: form.password,
    });
    if (error) {
      showMsg(error.message.toLowerCase().includes('confirm')
        ? "Please verify your email first"
        : "Wrong email or password");
    } else {
      navigate('/');
    }
    setLoading(false);
  };

  const inp = `w-full bg-white text-gray-800 px-3 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 outline-none text-sm`;
  const inpIcon = `w-full bg-white text-gray-800 pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 outline-none text-sm`;

  
return (
<div
  style={{
    backgroundImage: 'url(/super-nft-bg.png)',
    backgroundSize: 'contain',
    backgroundPosition: 'center top',
    backgroundRepeat: 'no-repeat',
    backgroundColor: '#0a0118',
    minHeight: '100vh',
    height: '100vh',
    width: '100vw',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0',
    margin: '0',
    position: 'fixed' as const,
    top: '0',
    left: '0',
  }}
>
  <div
    style={{
      maxHeight: '90vh',
      overflowY: 'auto' as const,
      width: '100%',
      maxWidth: '460px',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column' as const,
      justifyContent: 'center',
      alignItems: 'center',
    }}
  >


      <div className="rounded-2xl w-full max-w-md shadow-2xl border border-white/20"
        style={{ background: "rgba(255,255,255,0.97)", backdropFilter: "blur(16px)",
          padding: page === "register" ? "24px" : "32px" }}>

        {/* ── Register header inside card ── */}
        {page === "register" && (
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#EFF6FF" }}>
              <User size={20} style={{ color: BRAND.blue }} />
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: BRAND.blue }}>Create Account</h2>
              <p className="text-xs text-gray-400">Sign up to get started</p>
            </div>
          </div>
        )}

        {/* ── Login/OTP header ── */}
        {page !== "register" && (
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-3" style={{ background: BRAND.blue }}>
              <span className="text-white font-extrabold text-xl">N</span>
            </div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND.blue }}>
              {page === "login" ? "Welcome Back" : "Verify Email"}
            </h1>
            <p className="text-xs text-gray-400 mt-1">THE SUPER NFT</p>
          </div>
        )}

        {/* ── Register Form ─── */}
        {page === "register" && (
          <div className="space-y-3">
            {/* Full Name */}
            <div className="relative">
              <User size={15} className="absolute left-3 top-3 text-gray-400 pointer-events-none" />
              <input
                placeholder="Full Name"
                value={form.fullName}
                onChange={e => setForm({ ...form, fullName: e.target.value })}
                className={inpIcon}
              />
            </div>

            {/* Email + Send OTP button */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail size={15} className="absolute left-3 top-3 text-gray-400 pointer-events-none" />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className={inpIcon}
                />
              </div>
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={loading}
                className="px-4 rounded-xl text-white font-bold text-xs whitespace-nowrap disabled:opacity-50 flex-shrink-0"
                style={{ background: "linear-gradient(90deg,#8B5CF6,#3B82F6)" }}
              >
                {loading ? "..." : "Send"}
              </button>
            </div>

            {/* Confirm Email */}
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-3 text-gray-400 pointer-events-none" />
              <input
                type="email"
                placeholder="Confirm Email"
                value={form.confirmEmail}
                onChange={e => setForm({ ...form, confirmEmail: e.target.value })}
                className={inpIcon}
              />
            </div>

            {/* Phone Number with Country Code */}
<div className="mb-4">
  <label className="text-sm text-slate-400 mb-2 block">Phone Number *</label>
  <div className="flex gap-2">
    <select
      value={form.countryCode}
      onChange={(e) => setForm({...form, countryCode: e.target.value, phone: '' })}
      className="w-36 p-3 rounded-lg bg-slate-700 border border-slate-600 text-white"
      required
    >
      {COUNTRIES.map((c, index) => (
        <option key={`${c.code}-${c.name}-${index}`} value={c.code}>
          {c.flag} {c.code} {c.name}
        </option>
      ))}
    </select>

    <input
      type="tel"
      placeholder={`e.g. ${COUNTRIES.find(c => c.code === form.countryCode)?.example || '123456789'}`}
      value={form.phone}
      onChange={(e) => setForm({...form, phone: e.target.value.replace(/[^0-9]/g, '') })}
      className="flex-1 p-3 rounded-lg bg-slate-700 border border-slate-600 text-white"
      required
      maxLength={15}
    />
  </div>
  <p className="text-xs text-slate-500 mt-1">
    Selected: {COUNTRIES.find(c => c.code === form.countryCode)?.name}
  </p>
</div>
            {/* Password */}
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-3 text-gray-400 pointer-events-none" />
              <input
                type={showPw ? "text" : "password"}
                placeholder="Password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className={inpIcon + " pr-9"}
              />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-3 text-gray-400">
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
{/* Confirm Password */}
<div className="relative">
  <Lock size={15} className="absolute left-3 top-3 text-gray-400 pointer-events-none" />
  <input
    type="password"
    placeholder="Confirm Password"
    value={form.confirmPassword}
    onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
    className={inpIcon}
    required
  />
</div>
            
            {/* Referral Code */}
            <div className="relative">
              <Gift size={15} className="absolute left-3 top-3 text-gray-400 pointer-events-none" />
              <input
                placeholder="Referral Code (Optional)"
                value={form.referralCode}
                onChange={e => setForm({ ...form, referralCode: e.target.value })}
                className={inpIcon}
              />
            </div>

            {/* Terms & Conditions Checkbox */}
<div className="flex items-start gap-3 mb-4">
  <input
    type="checkbox"
    id="terms"
    checked={form.acceptTerms || false}
    onChange={(e) => setForm({ ...form, acceptTerms: e.target.checked })}
    className="w-5 h-5 mt-1 rounded bg-slate-700 border border-slate-600 cursor-pointer accent-cyan-500"
    required
  />
  <label htmlFor="terms" className="text-sm text-slate-300 cursor-pointer">
    Main <span className="text-cyan-400 underline">Terms & Conditions</span> se agree karta hun
  </label>
</div>

            {/* Sign Up button */}
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-white text-sm disabled:opacity-50 transition-all active:scale-95"
              style={{ background: "linear-gradient(90deg,#8B5CF6,#3B82F6)" }}
            >
              {loading ? "Please wait..." : "Sign Up"}
            </button>

            <button
              type="button"
              onClick={() => setPage("login")}
              className="text-sm w-full text-center text-gray-500"
            >
              Already have an account?{" "}
              <span className="font-semibold" style={{ color: "#3B82F6" }}>Login</span>
            </button>
          </div>
        )}

        {/* ── OTP Verify Form ─── */}
        {page === "register_otp" && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="rounded-xl p-4 text-center" style={{ background: "#EFF6FF" }}>
              <Mail className="mx-auto mb-1" size={22} style={{ color: BRAND.blue }} />
              <p className="text-xs text-gray-600">OTP sent to <b>{form.email}</b></p>
            </div>
            <input
              type="text"
              maxLength={6}
              placeholder="6-digit OTP"
              value={otpCode}
              onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
              className={inp + " text-center text-2xl tracking-widest font-bold"}
              autoFocus
            />
            <button
              type="submit"
              disabled={loading || otpCode.length !== 6}
              className="w-full py-3 rounded-xl font-bold text-white text-sm disabled:opacity-50"
              style={{ background: "linear-gradient(90deg,#8B5CF6,#3B82F6)" }}
            >
              {loading ? "Verifying..." : "Verify & Create Account"}
            </button>
            <button
              type="button"
              onClick={() => setPage("register")}
              className="text-sm text-gray-400 w-full flex items-center justify-center gap-1"
            >
              <ArrowLeft size={14} /> Back to Sign Up
            </button>
          </form>
        )}

        {/* ── Login Form ─── */}
        {page === "login" && (
          <form onSubmit={handleLogin} className="space-y-3">
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className={inp}
              required
            />
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                placeholder="Password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className={inp}
                required
              />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-3 text-gray-400">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-xs font-semibold transition-colors"
                style={{ color: BRAND.blue }}
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-white text-sm disabled:opacity-50"
              style={{ background: BRAND.red }}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
            <button
              type="button"
              onClick={() => setPage("register")}
              className="text-sm font-semibold w-full text-center"
              style={{ color: BRAND.blue }}
            >
              No account? Sign Up
            </button>
          </form>
          )}
      </div>
    </div>
    </div>
    );
}
        