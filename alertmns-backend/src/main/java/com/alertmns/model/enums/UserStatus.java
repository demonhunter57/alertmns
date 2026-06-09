package com.alertmns.model.enums;

/**
 * Statut de présence d'un utilisateur.
 *
 * ONLINE  : connecté et actif
 * AWAY    : connecté mais absent (avec message et date de retour optionnels)
 * OFFLINE : déconnecté
 */
public enum UserStatus {
    ONLINE,
    AWAY,
    OFFLINE
}
