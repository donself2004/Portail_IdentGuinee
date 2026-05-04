# IdentiGuinée 

Bienvenue sur le dépôt du projet **IdentiGuinée**, réalisé dans le cadre de la phase 2 du Miabé Hackathon !

Ce projet est une preuve de concept (PoC) visant à moderniser et sécuriser l'état civil en Guinée, en supprimant les intermédiaires et en luttant contre la fraude documentaire grâce à la technologie.

---

## 💡 La logique de l'application

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

## 🚀 Démarrer le projet en local

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

*Fait avec passion pour l'avenir numérique de la Guinée. 🇬🇳*
