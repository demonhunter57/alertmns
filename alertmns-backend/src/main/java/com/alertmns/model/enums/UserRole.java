package com.alertmns.model.enums;

/**
 * Rôles disponibles dans AlertMNS.
 *
 * ADMIN   : accès complet — gestion users, canaux, suppressions
 * MANAGER : peut créer des canaux privés et gérer les membres
 * USER    : utilisateur standard — lecture/écriture dans les canaux accessibles
 */
public enum UserRole {
    ADMIN,
    MANAGER,
    USER
}
