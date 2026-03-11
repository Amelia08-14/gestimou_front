'use client';

import React, { useState } from 'react';
import { 
  Shield, 
  Users, 
  History, 
  Database, 
  Save, 
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Lock,
  Search,
  Plus,
  UserPlus,
  Check,
  X
} from 'lucide-react';

const users = [
  { id: 1, name: 'Admin Principal', email: 'admin@aymen.com', role: 'Super Admin', status: 'Actif', lastActive: 'Il y a 2 min' },
  { id: 2, name: 'Karim Gestion', email: 'karim@aymen.com', role: 'Gestionnaire', status: 'Actif', lastActive: 'Il y a 1h' },
  { id: 3, name: 'Sarah Compta', email: 'sarah@aymen.com', role: 'Comptable', status: 'Inactif', lastActive: 'Il y a 2j' },
];

const logs = [
  { id: 1, action: 'Connexion', user: 'Admin Principal', date: '28 Jan 2026 10:23', details: 'Connexion depuis IP 192.168.1.1' },
  { id: 2, action: 'Ajout Résident', user: 'Karim Gestion', date: '28 Jan 2026 09:15', details: 'Ajout de M. Benali (Lot A12)' },
  { id: 3, action: 'Modification Bien', user: 'Admin Principal', date: '27 Jan 2026 16:45', details: 'Mise à jour prix F4 Standing' },
  { id: 4, action: 'Sauvegarde', user: 'Système', date: '27 Jan 2026 00:00', details: 'Backup automatique journalier' },
];

export default function AdminPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('users');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'ADMIN',
    profession: '',
    zone: '',
    password: ''
  });
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  // Load users and requests on mount
  React.useEffect(() => {
    fetchUsers();
    fetchRequests();
  }, []);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  const fetchRequests = () => {
    const token = localStorage.getItem('token');
    fetch(`${API_URL}/registrations`, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setRequests(data);
      })
      .catch(err => console.error(err));
  };

  const handleApproveRequest = async (id: string) => {
    if (!confirm('Voulez-vous valider cette inscription ? Cela créera un compte utilisateur.')) return;
    
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/registrations/${id}/approve`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.ok) {
            const data = await res.json();
            alert(`Compte créé avec succès !\nMot de passe temporaire : ${data.tempPassword}`);
            fetchRequests();
            fetchUsers(); // Refresh users list too
        } else {
            alert('Erreur lors de la validation.');
        }
    } catch (e) {
        console.error(e);
        alert('Erreur technique');
    }
  };

  const handleRejectRequest = async (id: string) => {
    if (!confirm('Voulez-vous rejeter cette demande ?')) return;

    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/registrations/${id}/reject`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.ok) {
            fetchRequests();
        } else {
            alert('Erreur lors du rejet.');
        }
    } catch (e) {
        console.error(e);
        alert('Erreur technique');
    }
  };

  const fetchUsers = () => {
    fetch(`${API_URL}/users`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
            // Filter out residents (mobile app users)
            const staffUsers = data.filter((u: any) => u.role !== 'RESIDENT');
            setUsers(staffUsers);
        } else {
            setUsers([]);
        }
      })
      .catch(err => console.error(err));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEdit = (user: any) => {
    setSelectedUser(user);
    setFormData({
        name: user.name || '',
        email: user.email || '',
        role: user.role || 'ADMIN',
        profession: user.profession || '',
        zone: user.zone || '',
        password: '' // Keep password empty unless changing
    });
    setShowAddUserModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const url = selectedUser ? `${API_URL}/users/${selectedUser.id}` : `${API_URL}/users`;
      const method = selectedUser ? 'PUT' : 'POST';
      
      const body: any = { ...formData };
      if (!body.password && selectedUser) delete body.password; // Don't send empty password on update

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        fetchUsers();
        setShowAddUserModal(false);
        setFormData({ name: '', email: '', role: 'ADMIN', profession: '', zone: '', password: '' });
        setSelectedUser(null);
      } else {
        alert('Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error(error);
      alert('Erreur technique');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-slate-900">Administration du Système</h1>
        <p className="text-sm text-slate-500">Gérez les accès, la sécurité et les données de la plateforme.</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
              activeTab === 'users'
                ? 'border-brand-blue text-brand-blue'
                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
            }`}
          >
            <Users className="h-4 w-4" />
            Utilisateurs & Rôles
          </button>
          <button
            onClick={() => setActiveTab('registrations')}
            className={`flex items-center gap-2 border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
              activeTab === 'registrations'
                ? 'border-brand-blue text-brand-blue'
                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
            }`}
          >
            <UserPlus className="h-4 w-4" />
            Demandes d'inscription
            {requests.filter(r => r.status === 'PENDING').length > 0 && (
                <span className="ml-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600">
                    {requests.filter(r => r.status === 'PENDING').length}
                </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
              activeTab === 'history'
                ? 'border-brand-blue text-brand-blue'
                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
            }`}
          >
            <History className="h-4 w-4" />
            Historique & Audit
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`flex items-center gap-2 border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
              activeTab === 'backup'
                ? 'border-brand-blue text-brand-blue'
                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
            }`}
          >
            <Database className="h-4 w-4" />
            Sauvegardes
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'users' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher un utilisateur..."
                  className="w-full rounded-lg border border-slate-200 pl-10 pr-4 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
                />
              </div>
              <button 
                onClick={() => setShowAddUserModal(true)}
                className="flex items-center gap-2 rounded-lg bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
              >
                <Plus className="h-4 w-4" />
                Nouvel utilisateur
              </button>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-700">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Utilisateur</th>
                    <th className="px-6 py-4 font-semibold">Rôle</th>
                    <th className="px-6 py-4 font-semibold">Statut</th>
                    <th className="px-6 py-4 font-semibold">Dernière activité</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-500">Aucun utilisateur trouvé.</td>
                    </tr>
                  ) : (
                    users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-gold text-brand-blue font-bold text-xs">
                            {user.name ? user.name.substring(0, 2).toUpperCase() : '??'}
                          </div>
                          <div>
                            <div className="font-medium text-slate-900">{user.name}</div>
                            <div className="text-xs text-slate-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                          <Shield className="h-3 w-3" />
                          {user.role}
                          {user.role === 'INTERVENANT' && user.profession && ` (${user.profession})`}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-green-50 text-green-700`}>
                          Actif
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                            onClick={() => handleEdit(user)}
                            className="text-brand-blue hover:underline text-xs font-medium"
                        >
                            Modifier
                        </button>
                      </td>
                    </tr>
                  )))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'registrations' && (
            <div className="space-y-6 animate-in fade-in duration-300">
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-700">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Demandeur</th>
                                <th className="px-6 py-4 font-semibold">Contact</th>
                                <th className="px-6 py-4 font-semibold">Bien Déclaré</th>
                                <th className="px-6 py-4 font-semibold">Statut</th>
                                <th className="px-6 py-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {requests.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">Aucune demande d'inscription.</td>
                                </tr>
                            ) : (
                                requests.map((req) => (
                                    <tr key={req.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900">{req.firstName} {req.lastName}</div>
                                            <div className="text-xs text-slate-500">Inscrit le {new Date(req.createdAt).toLocaleDateString()}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-slate-900">{req.email}</div>
                                            <div className="text-xs text-slate-500">{req.phone}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-slate-900 font-medium">{req.residenceId === 'prestige' ? 'Résidence Prestige' : req.residenceId}</div>
                                            <div className="text-xs text-slate-500">
                                                Bloc {req.block}, Etage {req.floor}, Porte {req.door}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                                req.status === 'APPROVED' ? 'bg-green-50 text-green-700' :
                                                req.status === 'REJECTED' ? 'bg-red-50 text-red-700' :
                                                'bg-yellow-50 text-yellow-700'
                                            }`}>
                                                {req.status === 'APPROVED' ? 'Validé' : req.status === 'REJECTED' ? 'Rejeté' : 'En attente'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {req.status === 'PENDING' && (
                                                <div className="flex justify-end gap-2">
                                                    <button 
                                                        onClick={() => handleApproveRequest(req.id)}
                                                        className="p-1 rounded bg-green-50 text-green-600 hover:bg-green-100"
                                                        title="Valider"
                                                    >
                                                        <Check className="h-4 w-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleRejectRequest(req.id)}
                                                        className="p-1 rounded bg-red-50 text-red-600 hover:bg-red-100"
                                                        title="Rejeter"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                <h3 className="font-semibold text-slate-900">Journal d'audit (Logs)</h3>
              </div>
              <div className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50">
                    <div className="flex items-start gap-4">
                      <div className="mt-1 rounded-full bg-slate-100 p-2 text-slate-500">
                        <History className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{log.action}</p>
                        <p className="text-sm text-slate-500">{log.details}</p>
                        <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                          <Users className="h-3 w-3" />
                          <span>{log.user}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-xs text-slate-500">
                      {log.date}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'backup' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-green-50 p-3 text-green-600">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">État du Système</h3>
                    <p className="text-sm text-green-600 font-medium">Opérationnel • Base de données synchronisée</p>
                  </div>
                </div>
                <div className="mt-6 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Dernière sauvegarde</span>
                    <span className="font-medium text-slate-900">Aujourd'hui, 00:00</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Taille de la BDD</span>
                    <span className="font-medium text-slate-900">45.2 MB</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-4">Actions de maintenance</h3>
                <div className="space-y-3">
                  <button className="flex w-full items-center justify-between rounded-lg border border-slate-200 p-3 text-left hover:bg-slate-50 hover:border-brand-blue transition-colors">
                    <div className="flex items-center gap-3">
                      <Save className="h-5 w-5 text-brand-blue" />
                      <div>
                        <div className="font-medium text-slate-900">Créer une sauvegarde</div>
                        <div className="text-xs text-slate-500">Exporter la base de données maintenant</div>
                      </div>
                    </div>
                  </button>
                  <button className="flex w-full items-center justify-between rounded-lg border border-slate-200 p-3 text-left hover:bg-slate-50 hover:border-red-500 transition-colors group">
                    <div className="flex items-center gap-3">
                      <RotateCcw className="h-5 w-5 text-slate-400 group-hover:text-red-500" />
                      <div>
                        <div className="font-medium text-slate-900 group-hover:text-red-600">Restaurer une version</div>
                        <div className="text-xs text-slate-500">Revenir à un état précédent</div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 p-6">
              <h2 className="text-xl font-bold text-slate-900">
                {selectedUser ? "Modifier l'utilisateur" : "Nouvel Utilisateur"}
              </h2>
              <button 
                onClick={() => setShowAddUserModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            
            <form className="p-6 space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Nom Complet</label>
                <input 
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    type="text" 
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-blue focus:ring-1 focus:ring-brand-blue outline-none" 
                    placeholder="Ex: Jean Dupont" 
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Email</label>
                <input 
                    name="email"
                    required
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-blue focus:ring-1 focus:ring-brand-blue outline-none" 
                    placeholder="exemple@aymen.com" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Mot de passe</label>
                <input 
                    name="password"
                    type="text"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-blue focus:ring-1 focus:ring-brand-blue outline-none" 
                    placeholder={selectedUser ? "Laisser vide pour ne pas changer" : "Mot de passe par défaut: password123"} 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Rôle</label>
                  <select 
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-blue focus:ring-1 focus:ring-brand-blue outline-none"
                  >
                    <option value="ADMIN">Administrateur (Directeur)</option>
                    <option value="RESPONSABLE_ZONE">Responsable de Zone (Gestionnaire)</option>
                    <option value="RECOUVREMENT">Chargé du Recouvrement</option>
                    <option value="HSE">HSE</option>
                    <option value="INTERVENANT">Intervenant</option>
                    <option value="MANAGER">Manager (Générique)</option>
                  </select>
                </div>
                {formData.role === 'INTERVENANT' && (
                    <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Profession</label>
                    <input 
                        name="profession"
                        value={formData.profession}
                        onChange={handleInputChange}
                        placeholder="Ex: Electricien"
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-blue focus:ring-1 focus:ring-brand-blue outline-none"
                    />
                    </div>
                )}
                {formData.role === 'RESPONSABLE_ZONE' && (
                    <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Zone Assignée</label>
                    <select 
                        name="zone"
                        value={formData.zone}
                        onChange={handleInputChange}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-blue focus:ring-1 focus:ring-brand-blue outline-none"
                    >
                        <option value="">Sélectionner une zone</option>
                        <option value="Zone 1">Zone 1 (Draria, El Achour...)</option>
                        <option value="Zone 2">Zone 2 (Ben Aknoun, Hydra...)</option>
                        <option value="Zone 3">Zone 3 (Les Sources, Birkhadem...)</option>
                    </select>
                    </div>
                )}
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-brand-blue px-6 py-2 text-sm font-bold text-white hover:bg-blue-800 shadow-md"
                >
                  {isSubmitting ? 'Création...' : "Créer l'utilisateur"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
