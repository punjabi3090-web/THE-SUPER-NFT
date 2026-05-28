import { useState } from "react";
import { Copy, Check } from "lucide-react";
import BottomNav from "../components/BottomNav";
import { testUser, TEST_MODE } from "../App";

const dummyMembers = [
  { uid: "USR001", deposit: "$200", commission: "$10.00" },
  { uid: "USR002", deposit: "$150", commission: "$7.50" },
  { uid: "USR003", deposit: "$300", commission: "$15.00" },
  { uid: "USR004", deposit: "$80", commission: "$4.00" },
  { uid: "USR005", deposit: "$120", commission: "$6.00" },
];
const dummyLvl2 = [
  { uid: "USR101", deposit: "$500", commission: "$15.00" },
  { uid: "USR102", deposit: "$250", commission: "$7.50" },
  { uid: "USR103", deposit: "$180", commission: "$5.40" },
];
const dummyLvl3 = [
  { uid: "USR201", deposit: "$400", commission: "$4.00" },
  { uid: "USR202", deposit: "$220", commission: "$2.20" },
];

export default function Team() {
  const [activeTab, setActiveTab] = useState("Lvl1");
  const [copied, setCopied] = useState(false);

  const inviteLink = `${window.location.origin}/login?ref=${testUser.uid}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    console.log('invite link copied', inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const members = activeTab === "Lvl1" ? dummyMembers : activeTab === "Lvl2" ? dummyLvl2 : dummyLvl3;

  return (
    <div className="min-h-screen pb-28" style={{background: '#f9fafb', maxWidth: '448px', margin: '0 auto'}}>
      {TEST_MODE && (
        <div className="bg-yellow-400 text-yellow-900 text-xs font-bold text-center py-1">🧪 Test Mode</div>
      )}

      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <h1 className="text-xl font-bold text-slate-800">My Team</h1>
      </div>

      {/* Stats */}
      <div className="mx-4 grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-slate-800">25</p>
          <p className="text-xs text-slate-500 mt-1">Total Members</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-emerald-600">$52.90</p>
          <p className="text-xs text-slate-500 mt-1">Commission</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-4 mb-4">
        {["Lvl1", "Lvl2", "Lvl3"].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === tab ? 'bg-emerald-500 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Members Table */}
      <div className="mx-4 bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="grid grid-cols-3 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-500 border-b border-slate-100">
          <span>UID</span>
          <span className="text-center">Deposit</span>
          <span className="text-right">Commission</span>
        </div>
        {members.map((m, i) => (
          <div key={i} className="grid grid-cols-3 px-4 py-3 text-sm border-b border-slate-50 last:border-0">
            <span className="text-slate-700 font-medium">{m.uid}</span>
            <span className="text-center text-slate-600">{m.deposit}</span>
            <span className="text-right text-emerald-600 font-semibold">{m.commission}</span>
          </div>
        ))}
      </div>

      {/* Fixed Invite Button */}
      <div className="fixed bottom-16 left-0 right-0 px-4 pb-3" style={{maxWidth: '448px', margin: '0 auto', left: '50%', transform: 'translateX(-50%)'}}>
        <button
          onClick={handleCopy}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 shadow-lg"
        >
          {copied ? <Check size={18} /> : <Copy size={18} />}
          {copied ? "Link Copied!" : "Copy Invite Link"}
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
