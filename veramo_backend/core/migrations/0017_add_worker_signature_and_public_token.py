from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0016_alter_schedule_options_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='demissaoprocess',
            name='documento_assinado_trabalhador',
            field=models.FileField(blank=True, null=True, upload_to='assinaturas/trabalhador/%Y/%m/', help_text='Documento assinado pelo trabalhador'),
        ),
        migrations.AddField(
            model_name='demissaoprocess',
            name='assinado_trabalhador',
            field=models.BooleanField(default=False, help_text='Trabalhador confirmou assinatura'),
        ),
        migrations.AddField(
            model_name='demissaoprocess',
            name='data_assinatura_trabalhador',
            field=models.DateTimeField(blank=True, null=True, help_text='Data da assinatura pelo trabalhador'),
        ),
        migrations.AddField(
            model_name='demissaoprocess',
            name='employee_upload_token',
            field=models.CharField(max_length=64, blank=True, null=True, help_text='Token público para upload do trabalhador'),
        ),
        migrations.AddField(
            model_name='demissaoprocess',
            name='employee_upload_expires',
            field=models.DateTimeField(blank=True, null=True, help_text='Validade do token de upload do trabalhador'),
        ),
    ]



