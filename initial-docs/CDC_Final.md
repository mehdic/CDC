# Cahier des Charges UX/UI — MetaPharm Connect  
**Version :** 17.05.2025

## 1. Objectif de cette étape

Cette étape pose les fondations de la plateforme **MetaPharm Connect** et permet d’aligner la vision produit sur les fonctionnalités principales. Elle vise à représenter la structure des pages, les parcours utilisateurs clés et les interactions majeures avant le design détaillé sur Figma.

**Bénéfices :**
- Clarifier les besoins pour chaque type d’utilisateur (patients, pharmaciens).
- Valider la logique de navigation et l’ergonomie.
- Préparer le maquettage haute fidélité (UI sur Figma).

**Livrables attendus :**
- **Sitemap** : arborescence des pages.  
- **Navigation** : parcours et logique de circulation entre les écrans.  
- **Wireframes basse fidélité** : maquettes fonctionnelles simplifiées des pages clés.

---

## 2. Personae & Parcours

### Pharmaciens

**Fonctionnalités clés :**
- Gestion du **master account** et des comptes associés.
- Gestion de la **page de la pharmacie**.
- Gestion des **annonces / marketing**.
- **Website analytics**.
- **Téléconsultation** : gestion des RDV et documentation des consultations.
- **Gestion des RDV** : physique (vaccination, consultations en officine) et télé‑RDV.
- Gestion du **stock en temps réel**.
- Gestion des **informations produit** : mises à jour, commentaires.
- **Messagerie** intégrée.
- **Messages vocaux / appels transcrits**.
- Intégration des messageries de la pharmacie avec MetaPharm : email, WhatsApp, fax.
- **Gestion des ordonnances**.
- **Appels visio**.
- Communication **sécurisée avec les médecins**.
- **Gestion des livraisons** : attribution livreur et suivi.

**Besoins spécifiques :**
- **Sécurité** : données chiffrées.
- **Dashboard** unifiant les outils : compendium d’informations produit, stock (quantité, délais), interactions médicament‑traitements du patient / allergies.

**Parcours type (objectif : valider ordonnances, conseiller, préparer, gérer stock) :**
1. **Connexion sécurisée** (MFA)  
   Accès au tableau de bord : ordonnances reçues, consultations à venir (confirmer / reporter / annuler), notifications IA.
2. **Traitement des ordonnances**  
   Lecture automatique et transcription par IA. Vérifications IA (allergies, interactions). Validation ou demande de modification (messagerie médecin). Génération du plan de traitement et intégration au dossier patient.
3. **Consultation patient** (si demandée)  
   Lancement visio depuis « Téléconsultation ». Prise de notes (IA + manuelle) avec consentement et enregistrement dossier.
4. **Préparation commande**  
   Regroupement produits, scan QR, étiquetage, attribution livreur.
5. **Gestion du stock**  
   Scan QR mise à jour. IA : alertes péremption / faible stock / rupture, propositions de réapprovisionnement.
6. **Communication**  
   Chat sécurisé médecin et patient (style WhatsApp). Suivi des incidents livreur.
7. **Livraison**  
   Attribution livreur, suivi GPS. Pour stupéfiants/produits au froid : signature et pièce d’identité. Traçabilité des livraisons et optimisation de routes.

---

### Médecins

**Fonctionnalités clés :**
- **Communication interprofessionnelle** médecin‑pharmacien.  
- **Consultation pharmacie‑médecin** : le pharmacien prend en charge en présentiel, le médecin prescrit par visio.  
- **Renouvellement d’ordonnances**.

**Besoins spécifiques :**
- **Sécurité** : données chiffrées.
- **Rapidité**.
- **Données organisées** et à jour.
- **Design minimaliste** et facile.

**Parcours type (objectif : prescrire efficacement, suivre, relier à la pharmacie) :**
1. **Connexion e‑ID** (prestataire HIN en Suisse)  
   Accès dashboard, dossier patient tenu par la pharmacie (avec consentement), messagerie.
2. **Consultation du dossier patient**  
   Historique d’ordonnances, plan de traitement actif, observance (statistiques).
3. **Création / renouvellement d’ordonnance**  
   Formulaire intelligent (médicament, posologie, durée), suggestions IA selon diagnostic, envoi direct au pharmacien choisi.
4. **Communication**  
   Messagerie avec pharmacien, notifications en cas de validation incomplète ou rupture stock.
5. **Suivi du traitement**  
   Visualisation plans de traitement, historique des commandes et conseils reçus par le patient.

---

### Infirmiers

**Fonctionnalités clés :**
- Commander facilement des médicaments pour les patients.
- Accès au **dossier patient** de la pharmacie : liste produits, validité ordonnance, prise en charge.
- Partage d’informations **pharmacie ↔ équipe infirmière**.

**Besoins spécifiques :**
- Communication fluide.  
- **Traçabilité des commandes** (zéro transmission orale).  
- Suivi des livraisons pour organiser les passages (notifications dépôt chez le patient).

**Workflow automatisé :**
1. **Création de commande** : sélection patient, choix médicaments (avec historique et suggestions), note éventuelle (urgence, renouvellement), planification livraison.
2. **Validation automatique ordonnance** : vérification de validité, contrôle interactions, confirmation prise en charge (assurance / tiers‑payant).
3. **Traitement pharmacie** : notification, préparation selon disponibilité, enregistrement du pharmacien préparateur.
4. **Notification de livraison** : états (préparée, en cours, livrée), confirmation de dépôt dans dossier patient.
5. **Archivage & traçabilité** : horodatage, intervenants, contenu, export PDF possible.

---

### Livreurs

**Fonctionnalités clés :**
- Réception des **demandes de livraison** de la pharmacie.
- **Traçabilité** colis‑patient via QR code.
- **Helpline** rapide en cas de souci.

**Besoins spécifiques :**
- **Localisation GPS**.
- **Optimisation de tournée** par IA selon présence patients (signature), chaîne du froid, etc.

**Parcours type (objectif : livrer, scanner, confirmer, collecter retours) :**
1. **Connexion / début de tournée** : scan badge/code, accès planning optimisé.
2. **Préparation** : liste de colis et infos (adresse, fragile/froid/signature, ordonnance à récupérer, encaissement cash/carte).
3. **Livraison** : scan colis, remise au patient (signature électronique ou photo), récupération éventuelle de médicaments à recycler.
4. **Échec** : motif (absent, erreur d’adresse), notification automatique pharmacien/patient, reprogrammation ou retour.
5. **Fin de tournée** : scan retours, validation finale, mise à jour statuts, statistiques personnelles.

---

### Patients

**Fonctionnalités clés :**
- **Service personnalisé** : recommandations selon historique médical, préférences, achats; interface adaptative (chronique, ponctuel, préventif).
- **Téléconsultation** : accès direct aux pros de santé; intégration fluide dossier médical et prescriptions.
- **Achat sur ordonnance** : upload sécurisé, validation auto/manuelle, historique accessible.
- **E‑commerce** (parapharmacie et OTC) : catalogue intelligent, suggestions proactives.
- **Accès dossier médical** : visualisation sécurisée, synthèses, ordonnances, analyses, suivis.
- **Demande d’avance / renouvellement** : automatisé selon posologie; notifications intelligentes.
- **Prise de RDV** physique et en ligne : synchro avec agenda personnel, canal au choix.
- **Reviews** produits et services : évaluations, stats (achats, efficacité perçue, effets secondaires), commentaires.
- **Livraison intelligente** : suivi temps réel, ETA précis type Uber, statut livreur en temps réel.

**Besoins spécifiques :**
- **Autonomie & indépendance** : navigation fluide, actions en 1 clic, accès instantané aux fonctions santé.
- **Contrôle sur sa santé** : dashboards santé, historiques, alertes intelligentes; suggestions proactives.
- **Anticipation des inconforts** : prédiction des ruptures via IA & supply‑chain; alerte et suggestions de remplacement.  
  > Ne pas changer l’objectivité d’un fait, changer la manière dont il est vécu.
- **Réduction de l’effort** : processus simples et guidés; par défaut « tout est prêt » à valider.
- **Low cost, haute valeur** : transparence des prix; fidélité, abonnements personnalisés.
- **Programme Premium — Golden MetaPharm (VIP)** :  
  Accès prioritaire (téléconsultations 24/7, médicaments rares), conciergerie santé, suivi personnalisé, alertes prédictives, livraison express, pharmacien dédié.

**Parcours type :**
1. **Entrée du patient**  
   - Connexion / création de compte, saisie infos, 2FA.  
   - Profiling optionnel : questionnaire santé, création d’un **jumeau numérique** (dossier patient IA).
2. **Accueil personnalisé**  
   - Modules selon profil : alertes médicamenteuses, médicaments à renouveler, recommandations produits & RDV.  
   - Proposition de synchronisation avec dossier médical cantonal (API e‑santé) et agenda personnel.
3. **Actions**  
   - **Achat médicaments** : upload/sélection ordonnance, vérif IA + pharmacien, ajout panier + livraison.  
   - **Parapharmacie** : navigation catalogue intelligent, filtres santé/objectif, ajout panier.  
   - **Téléconsultation** : prise de RDV, appel vidéo sécurisé, ajout automatique d’ordonnance si prescrite.  
   - **Renouvellement** : détection IA de traitement régulier, suggestion de renouvellement automatique.  
   - **Suivi livraison** : tracking dynamique type Uber, ETA mis à jour en temps réel.
4. **Notifications & suivis proactifs**  
   Rappels de prise, alertes rupture de stock à venir, suggestion de consultation (symptômes récurrents), mise à jour automatique du dossier après chaque interaction.
5. **Interface feedback**  
   Reviews produits achetés, statistiques (achats/efficacité ressentie), notes de satisfaction sur consultations et livraisons.
6. **Fidélisation & personnalisation**  
   Scoring utilisateur et offres personnalisées. Accès **Golden MetaPharm** pour profil VIP détecté (priorité livraison/support, pharmacien référent, accès rapide à médicaments rares). Récompenses : crédits fidélité, remises, bonus par objectifs santé atteints.
7. **Boucle d’amélioration continue**  
   Analyse comportementale par IA, optimisation des recommandations, mises à jour automatiques du parcours utilisateur.

---

## 3. Sitemap — Organisation des contenus

**Requête : identification des pages principales**

1) **App Pharmacien**  
   - Page Login  
   - Dashboard  
   - Messagerie

2) **App Livreur**

3) **App Patient**

4) **App Infirmier**

5) **App Médecin**

**Classement logique des sections :** à préciser.

**Vision globale des parcours :**
- Côté patient : … → … → … → …
- Côté pharmacien : … → … → … → …

---

## 4. Logique de navigation

- **Menu principal** : …  
- **Accès rapides** : …  
- **Transitions clés** : comment l’utilisateur passe d’une section à l’autre.  
- **Différences mobile / desktop** : …

---

## 5. Livrable attendu — Wireframes basse fidélité

**Définition** : maquettes fonctionnelles simplifiées (sans couleur, images ni contenu final) illustrant l’organisation de l’interface.

**Écrans inclus :**
- Page d’accueil
- Page de recherche produit / service
- Fiche produit
- Parcours / interfaces de consultation — côté **pharmacien**
- Parcours / interfaces de consultation — côté **patient**
- Page de **messagerie** intégrée (texte et/ou visio)
- Page de **connexion / profil**

**À illustrer :**
- Position des blocs fonctionnels principaux
- Chemins d’action et de navigation
- Zones d’interaction (CTA, menus…)
