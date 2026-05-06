# IdentiGuinée — Portail d'Identité Numérique Nationale

Plateforme officielle de gestion d'identité numérique de la République de Guinée.

## Stack

- **React 18** + **Vite 5**
- **Supabase** (base de données, authentification)
- **React Router v6**
- **Lucide Icons**

## Démarrage local

```bash
npm install
npm run dev
```

## Déploiement Vercel

```bash
# 1. Push sur GitHub
git init && git add . && git commit -m "IdentiGuinée v10"
git remote add origin https://github.com/VOTRE_COMPTE/identiguinee.git
git push -u origin main

# 2. Import sur Vercel
# → https://vercel.com/new → importer le repo
# → Framework: Vite (auto-détecté)
# → Pas de variables d'env nécessaires (Supabase public key dans le code)
```

## Structure

```
src/
├── admin/          → Interface Administration
├── components/     → Sidebar, Header, Layout
├── context/        → AuthContext, NotificationContext
├── lib/            → supabase.js, documentTypes.js
└── pages/          → Toutes les pages citoyens
```

## Vérification QR Code

L'URL de vérification publique est :
```
https://votre-domaine.vercel.app/verify/{document_id}
ou
https://votre-domaine.vercel.app/verify?id={doc_id}&acte={id_acte}
```

Accessible sans connexion par toute organisation tierce.

## Comptes de démonstration

| Type | Login | Mot de passe |
|------|-------|-------------|
| Admin | `admin` | `admin123` → puis clé secrète : `IDENTIGUINEE@2025!` |
| Citoyen | Email ou N° acte | Mot de passe enregistré |
