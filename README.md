
# IdentiGuinée — Portail d'Identité Numérique Nationale

Plateforme officielle de gestion d'identité numérique de la République de Guinée.

Bienvenue sur le dépôt du projet **IdentiGuinée**, réalisé dans le cadre de la phase 2 du Miabé Hackathon !

Ce projet est une preuve de concept (PoC) visant à moderniser et sécuriser l'état civil en Guinée, en supprimant les intermédiaires et en luttant contre la fraude documentaire grâce à la technologie.

---

##  La logique de l'application

Le but d'IdentiGuinée est de rendre les démarches administratives simples, rapides et transparentes pour les citoyens guinéens. Voici le parcours de notre démo :

1. **Connexion citoyenne** : L'utilisateur s'identifie sur le portail (les données sont conservées dynamiquement pour personnaliser toute l'interface à son nom).
2. **Tableau de bord** : Une vue d'ensemble rassurante sur ses documents et les services disponibles (Passeport, CNI, etc.).
3. **Formulaire intelligent** : Lors d'une demande de document (ex: Carte Nationale d'Identité), le citoyen renseigne son **numéro d'acte de naissance**.
4. **Validation en temps réel** : Le système interroge instantanément notre base de données sécurisée. Si l'acte officiel est trouvé, le bouton "Continuer" se déverrouille.
5. **Traitement automatisé** : L'utilisateur assiste visuellement au processus de croisement des données. Aucune intervention humaine n'est requise, ce qui garantit la neutralité et bloque la corruption.
6. **Délivrance** : Le document officiel (sécurisé) est généré en quelques secondes.

---

## 🔗 Le concept "NaissanceChain" (Blockchain)

En Guinée, l'absence d'un registre d'état civil centralisé et infalsifiable est un défi majeur. C'est là qu'intervient notre concept de **NaissanceChain**.

Bien que simulé ici techniquement via Supabase pour les besoins de rapidité du hackathon, la vision est la suivante :
* Chaque acte de naissance se voit attribuer une "empreinte" numérique cryptographique (un *hash* blockchain).
* Une fois enregistré dans ce grand registre décentralisé gouvernemental, cet acte ne peut **jamais** être modifié, falsifié ou supprimé.
* Lorsqu'un citoyen fait une demande, notre plateforme vient interroger cette *NaissanceChain*. Si l'acte existe, il est validé. Cela permet d'éliminer le fléau des faux actes de naissance à la racine.

---

##  Démarrer le projet en local

Pour tester l'application sur votre machine (parfait pour la démo live), suivez ces étapes simples :

### 1. Prérequis
- Vous devez avoir [Node.js](https://nodejs.org/) installé sur votre ordinateur.

### 2. Installation
Ouvrez votre terminal, placez-vous dans le dossier du projet et installez les dépendances :
```bash
npm install
```

### 3. Base de données (Supabase)
Pour que la vérification en temps réel fonctionne :
1. Assurez-vous que vos identifiants Supabase sont bien renseignés dans `src/lib/supabase.js`.
2. Assurez-vous d'avoir créé la table `naissance_chain` et d'y avoir inséré au moins un acte (ex: `001/RC/MATAM/2023`).

### 4. Lancement
Démarrez le serveur de développement :
```bash
npm run dev
```
Ouvrez ensuite le lien affiché dans votre terminal (généralement `http://localhost:5173`) dans votre navigateur !

---

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

---

## 🛠️ Dernières Mises à Jour (06/05/2026)

De nombreuses améliorations de stabilité et de nouvelles fonctionnalités ont été ajoutées aujourd'hui pour rendre la démo robuste et professionnelle :

### ✅ Nouvelles Fonctionnalités
- **Téléchargement de documents** : Les citoyens peuvent désormais télécharger leurs documents générés (Passeport, CNI, etc.) aux formats **PDF** et **PNG**.
- **Synchronisation Cloud du Profil** : La photo de profil (avatar) est désormais sauvegardée dans Supabase. Vos modifications en local sont maintenant visibles sur la version déployée (Vercel).
- **Vérification Publique Renforcée** : Amélioration de la logique de lecture des QR codes pour une authentification instantanée.

### 📱 Interface & Responsivité
- **Full Responsive Design** : Optimisation complète pour mobile et tablette. Le portail est désormais parfaitement utilisable sur smartphone (menus burger, grilles adaptatives).
- **Amélioration du Dashboard** : Synchronisation plus intelligente des données citoyennes avec le registre *NaissanceChain*.

### 🐞 Correctifs & Stabilité
- **Fix "Écran Blanc"** : Résolution d'un crash critique sur la page de suivi des demandes lié au formatage des identifiants numériques.
- **Sécurisation des données** : Ajout de couches de sécurité (optional chaining) pour éviter les erreurs de rendu en cas de données incomplètes en base.
- **Support Vercel** : Documentation des étapes pour débloquer les déploiements sur les comptes Vercel Hobby.

---

*Fait avec passion pour l'avenir numérique de la Guinée. 🇬🇳*
