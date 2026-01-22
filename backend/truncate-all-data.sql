-- Truncate all tables to start fresh with encryption enabled
-- WARNING: This will delete ALL data!

TRUNCATE TABLE 
  users,
  sessions,
  password_resets,
  payments,
  payment_refunds,
  payment_webhook_logs,
  subscriptions,
  audit_logs,
  data_access_logs,
  feature_flags,
  newsletters,
  newsletter_subscriptions,
  notifications,
  notification_preferences,
  privacy_preferences,
  consent_records,
  consent_versions,
  data_deletion_requests,
  data_export_requests,
  breach_notifications,
  security_incidents,
  policy_acceptances,
  mfa_methods,
  mfa_backup_codes
CASCADE;

-- Reset any sequences if needed
ALTER SEQUENCE IF EXISTS users_id_seq RESTART WITH 1;
