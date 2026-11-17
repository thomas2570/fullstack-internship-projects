# Generated data migration to remove all demo accounts and dummy workspaces
from django.db import migrations


def remove_demo_accounts(apps, schema_editor):
    User = apps.get_model('authentication', 'User')
    Workspace = apps.get_model('workspaces', 'Workspace')

    demo_emails = [
        'admin@acme.com',
        'sarah.chen@acme.com',
        'marcus.v@acme.com',
        'elena.r@acme.com',
        'david.kim@acme.com',
        'priya.n@acme.com',
        'founder@starlight.io',
        'admin@example.com',
        'member@example.com',
        'owner@zeta.local',
        'member@zeta.local',
    ]
    demo_workspace_slugs = ['acme-corp', 'starlight-bio', 'default-workspace', 'zeta-tech']

    # Delete dummy workspaces (cascades to all their boards, projects, issues, sprints)
    Workspace.objects.filter(slug__in=demo_workspace_slugs).delete()
    # Delete dummy demo users
    User.objects.filter(email__in=demo_emails).delete()


def reverse_func(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('workspaces', '0001_initial'),
        ('authentication', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(remove_demo_accounts, reverse_func),
    ]
