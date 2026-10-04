import React, { useState, useEffect } from 'react';
import EditProfileModal from './EditProfileModal';
import { supabase } from '../../lib/supabase/client';

export const SettingsProfileCard: React.FC = () => {
  const [name, setName] = useState('User');
  const [salary, setSalary] = useState(50000);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const loadProfile = async () => {
    const localName = localStorage.getItem('drip_user_name');
    const localSalary = localStorage.getItem('drip_user_salary');
    if (localName) setName(localName);
    if (localSalary) setSalary(parseInt(localSalary, 10));

    try {
      const res = await fetch('/api/profile').then((r) => (r.ok ? r.json() : null));
      if (res?.authenticated && res.user) {
        if (res.user.name) setName(res.user.name);
        if (res.user.salary) setSalary(res.user.salary);
        if (res.user.avatarUrl) setAvatarUrl(res.user.avatarUrl);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const detected =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split('@')[0];
        if (detected) setName(detected);
        const pic = user.user_metadata?.avatar_url || user.user_metadata?.picture;
        if (pic) setAvatarUrl(pic);
      }
    } catch {}
  };

  useEffect(() => {
    loadProfile();
  }, []);

  return (
    <>
      <div className="bg-white rounded-[20px] p-4 shadow-sm border border-black/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-[14px] bg-[#B8ACFA] flex items-center justify-center text-black font-bold text-lg overflow-hidden border border-black/5">
            {avatarUrl ? (
              <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
            ) : (
              <span>{name.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="flex flex-col">
            <span className="font-body-500 text-[16px] text-black font-semibold">{name}</span>
            <span className="font-caption text-black/50 text-[12px]">
              Monthly Salary: ₹{salary.toLocaleString('en-IN')}.00
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsEditOpen(true)}
          className="px-3.5 py-1.5 bg-[#B8ACFA] hover:bg-[#a89af7] text-black text-[13px] font-semibold rounded-full active:scale-95 transition-all cursor-pointer shadow-xs"
        >
          Edit
        </button>
      </div>

      {/* Edit Profile & Budget Modal */}
      <EditProfileModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSaved={(updated) => {
          setName(updated.name);
          setSalary(updated.salary);
        }}
      />
    </>
  );
};

export default SettingsProfileCard;
