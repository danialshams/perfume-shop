# Fertini cPanel automatic deployment

The former SSH push deployment has been retired because inbound SSH could not be reached from the user's network. The supported implementation is the outbound HTTPS pull from public GitHub Releases using cPanel Cron Jobs.

See [FERTINI_CPANEL_CRON_AUTODEPLOY.md](FERTINI_CPANEL_CRON_AUTODEPLOY.md) for setup, host account quota checks, safety gate, and rollback.

This implementation does not enable automatic changes on the live host until the account owner creates the opt-in marker.
