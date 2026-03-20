import { useState, useEffect } from 'react';

const STORAGE_KEYS = {
  theme: 'crm_theme',
  notifSound: 'crm_notif_sound',
  pollInterval: 'crm_poll_interval',
  dateFormat: 'crm_date_format'
};

export default function Settings() {
  const [theme, setTheme] = useState('light');
  const [notifSound, setNotifSound] = useState(true);
  const [pollInterval, setPollInterval] = useState(15);
  const [dateFormat, setDateFormat] = useState('au');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem(STORAGE_KEYS.theme) || 'light';
    setTheme(t);
    document.documentElement.setAttribute('data-theme', t);
    setNotifSound(localStorage.getItem(STORAGE_KEYS.notifSound) !== 'false');
    setPollInterval(parseInt(localStorage.getItem(STORAGE_KEYS.pollInterval) || '15', 10));
    setDateFormat(localStorage.getItem(STORAGE_KEYS.dateFormat) || 'au');
  }, []);

  const save = () => {
    localStorage.setItem(STORAGE_KEYS.theme, theme);
    localStorage.setItem(STORAGE_KEYS.notifSound, String(notifSound));
    localStorage.setItem(STORAGE_KEYS.pollInterval, String(pollInterval));
    localStorage.setItem(STORAGE_KEYS.dateFormat, dateFormat);
    document.documentElement.setAttribute('data-theme', theme);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-2xl space-y-6 animate-slide-up">
      <header>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">System preferences aur options</p>
      </header>

      <div className="space-y-8">
        <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Appearance</h3>
          <div className="flex items-center justify-between py-3 border-b border-slate-200/60 dark:border-slate-700/60">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Theme</label>
            <select
              value={theme}
              onChange={e => setTheme(e.target.value)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Notifications</h3>
          <div className="flex items-center justify-between py-3">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Browser notification on new alert</label>
            <select
              value={notifSound ? 'on' : 'off'}
              onChange={e => setNotifSound(e.target.value === 'on')}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none transition-all"
            >
              <option value="on">On</option>
              <option value="off">Off</option>
            </select>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Data</h3>
          <div className="flex items-center justify-between py-3">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Date format</label>
            <select
              value={dateFormat}
              onChange={e => setDateFormat(e.target.value)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none transition-all"
            >
              <option value="au">DD/MM/YYYY (AU)</option>
              <option value="us">MM/DD/YYYY (US)</option>
              <option value="iso">YYYY-MM-DD</option>
            </select>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">System Info</h3>
          <div className="space-y-3 text-sm">
            <p className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">CRM Version</span><span className="font-medium text-slate-900 dark:text-white">1.0</span></p>
            <p className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Reminder Job</span><span className="font-medium text-slate-900 dark:text-white">Daily 9 AM AEST</span></p>
            <p className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Email</span><span className="font-medium text-slate-900 dark:text-white">Overdue & deadline reminders</span></p>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={save}
        className={`w-full sm:w-auto px-8 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
          saved
            ? 'bg-emerald-500 text-white'
            : 'bg-primary-500 hover:bg-primary-600 text-white shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30'
        }`}
      >
        {saved ? 'Saved ✓' : 'Save Settings'}
      </button>
    </div>
  );
}
