import React, { useState, useEffect } from 'react';
import { Settings, Cloud, ShieldCheck, RefreshCw, CheckCircle2, Save, Key } from 'lucide-react';
import { OperatingMode, AzureStatus } from '../types';
import { api } from '../services/api';

interface SettingsPageProps {
  mode: OperatingMode;
  onModeChange: (mode: OperatingMode) => void;
  workerCount: number;
  onScaleWorkers: (count: number) => void;
  awsStatus: AzureStatus | null;
  onRefreshAwsStatus: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  mode,
  onModeChange,
  workerCount,
  onScaleWorkers,
  awsStatus,
  onRefreshAwsStatus,
}) => {
  const [region, setRegion] = useState(awsStatus?.region || 'eastus');
  const [profile, setProfile] = useState(awsStatus?.profile || 'cloudburst-sp');
  const [inputBucket, setInputBucket] = useState(awsStatus?.input_bucket || 'cloudburst-input-container');
  const [outputBucket, setOutputBucket] = useState(awsStatus?.output_bucket || 'cloudburst-output-container');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    if (awsStatus) {
      setRegion(awsStatus.region);
      setProfile(awsStatus.profile || 'default');
      setInputBucket(awsStatus.input_bucket);
      setOutputBucket(awsStatus.output_bucket);
    }
  }, [awsStatus]);

  const handleSaveAzure = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage(null);
    try {
      await api.updateAzureConfig({
        operating_mode: mode,
        region,
        storage_account: profile,
        input_bucket: inputBucket,
        output_bucket: outputBucket,
      });
      setSaveMessage('Azure configuration updated successfully.');
      onRefreshAwsStatus();
    } catch (err: any) {
      setSaveMessage(`Failed to update config: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-cyan-400" />
          System Configuration &amp; Azure Settings
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Toggle operating modes, configure Microsoft Azure Blob containers, and tune parallel compute worker concurrency.
        </p>
      </div>

      {/* Azure Cloud Mode Active */}
      <div className="p-6 rounded-2xl border border-sky-800/40 bg-sky-950/20 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-sky-400" />
          Operating Engine Mode
        </h3>
        <div className="p-4 rounded-xl border-2 border-sky-500 bg-sky-950/20 shadow-lg shadow-sky-500/10">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-sm text-sky-300 flex items-center gap-2">
              <Cloud className="w-4 h-4" /> AZURE CLOUD MODE — ACTIVE
            </span>
            <CheckCircle2 className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Connected to Azure Blob Storage via <code className="font-mono bg-slate-800 px-1 rounded">azure-storage-blob</code> SDK with Managed Identity / Connection String. Azure Function{' '}
            <code className="font-mono bg-slate-800 px-1 rounded">cloudburst-processor</code> is deployed and processing
            jobs via Azure Service Bus. All file I/O routes through Azure Blob containers.
          </p>
        </div>
      </div>

      {/* Azure Cloud Settings Form */}
      <form onSubmit={handleSaveAzure} className="p-6 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Cloud className="w-4 h-4 text-sky-400" />
            Microsoft Azure Configuration
          </h3>
          <button
            type="button"
            onClick={onRefreshAwsStatus}
            className="text-xs text-cyan-400 hover:text-cyan-300 transition flex items-center gap-1 font-semibold"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Test Connection
          </button>
        </div>

        {/* Azure Live Status Card */}
        <div
          className={`p-4 rounded-xl border text-xs ${
            awsStatus?.is_connected
              ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
              : 'bg-slate-950 border-slate-800 text-slate-400'
          }`}
        >
          <div className="flex items-center gap-2">
            {awsStatus?.is_connected ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <Key className="w-4 h-4 text-sky-400 shrink-0" />
            )}
            <div>
              <span className="font-semibold block">
                {awsStatus?.is_connected ? 'Azure Connection Established' : 'Azure Credential Status'}
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                {awsStatus?.message || 'Checking Azure credentials...'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-400 font-medium mb-1">Azure Region</label>
            <input
              type="text"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="eastus"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 font-mono focus:border-sky-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Storage Account / Profile</label>
            <input
              type="text"
              value={profile}
              onChange={(e) => setProfile(e.target.value)}
              placeholder="cloudburststorage"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 font-mono focus:border-sky-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Input Blob Container</label>
            <input
              type="text"
              value={inputBucket}
              onChange={(e) => setInputBucket(e.target.value)}
              placeholder="cloudburst-input-container"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 font-mono focus:border-sky-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Output Blob Container</label>
            <input
              type="text"
              value={outputBucket}
              onChange={(e) => setOutputBucket(e.target.value)}
              placeholder="cloudburst-output-container"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 font-mono focus:border-sky-500 focus:outline-none"
            />
          </div>
        </div>

        {saveMessage && (
          <div className="p-3 bg-cyan-950/40 text-cyan-300 border border-cyan-800/40 rounded-lg text-xs font-mono">
            {saveMessage}
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs transition shadow-lg shadow-cyan-500/20 flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving Configuration...' : 'Save Azure Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};
