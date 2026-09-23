package com.restaurantpos.users.entity;

/**
 * Authentication type distinguishing administrative users from ordinary staff.
 *
 * - PASSWORD_AND_PIN: For Administrators (can login with Username+Password or PIN).
 * - PIN_ONLY: For ordinary restaurant employees (Cashier, Waiter, Kitchen, etc.),
 *             who have NO username and NO password, and login exclusively via touch PIN.
 */
public enum AuthenticationType {
    PASSWORD_AND_PIN,
    PIN_ONLY
}
