import { Container, Title, Text, Stack, Anchor, Divider } from "@mantine/core";

const APP_NAME = "Splitwise"; // <- sostituisci con il nome della tua app
const APP_URL = "https://r78fm3-3000.csb.app/"; // <- sostituisci con il tuo dominio
const CONTACT_EMAIL = "antonio.durante@test.com"; // <- sostituisci con la tua email
const LAST_UPDATED = "10 marzo 2025";

export const metadata = {
  title: `Privacy Policy – ${APP_NAME}`,
  description: `Informativa sulla privacy di ${APP_NAME}`,
  robots: "noindex",
};

export default function PrivacyPage() {
  return (
    <Container size="md" py="xl">
      <Stack gap="xl">
        <Stack gap="xs">
          <Title order={1}>Privacy Policy</Title>
          <Text c="dimmed" size="sm">
            Ultimo aggiornamento: {LAST_UPDATED}
          </Text>
        </Stack>

        <Text>
          La presente informativa descrive come <strong>{APP_NAME}</strong> (
          {APP_URL}) raccoglie, utilizza e gestisce i dati personali degli
          utenti, con particolare riferimento ai dati ottenuti tramite
          autenticazione Google (OAuth 2.0).
        </Text>

        <Divider />

        {/* 1 */}
        <Stack gap="sm">
          <Title order={2} size="h4">
            1. Dati raccolti tramite Google OAuth
          </Title>
          <Text>
            Quando accedi a {APP_NAME} tramite il tuo account Google, riceviamo
            da Google le seguenti informazioni del tuo profilo pubblico:
          </Text>
          <Stack gap="xs" pl="md">
            <Text>• Nome e cognome</Text>
            <Text>• Indirizzo email</Text>
            <Text>• Immagine del profilo (avatar)</Text>
            <Text>• Identificativo univoco Google (sub/ID)</Text>
          </Stack>
          <Text>
            Non accediamo alla tua password Google né ad altri dati del tuo
            account Google (Gmail, Drive, Calendario, ecc.) al di là di quanto
            elencato sopra.
          </Text>
        </Stack>

        {/* 2 */}
        <Stack gap="sm">
          <Title order={2} size="h4">
            2. Finalità del trattamento
          </Title>
          <Text>I dati raccolti sono utilizzati esclusivamente per:</Text>
          <Stack gap="xs" pl="md">
            <Text>
              • <strong>Autenticazione</strong>: identificarti e consentire
              l&apos;accesso sicuro alla tua area personale.
            </Text>
            <Text>
              • <strong>Personalizzazione</strong>: mostrare il tuo nome e
              avatar all&apos;interno dell&apos;applicazione.
            </Text>
            <Text>
              • <strong>Comunicazioni di servizio</strong>: inviarti eventuali
              notifiche strettamente legate al funzionamento dell&apos;app (es.
              reset account, aggiornamenti critici).
            </Text>
          </Stack>
          <Text>
            I dati Google non vengono utilizzati per scopi pubblicitari, analisi
            di marketing o per qualunque finalità diversa da quelle indicate in
            questa sezione.
          </Text>
        </Stack>

        {/* 3 */}
        <Stack gap="sm">
          <Title order={2} size="h4">
            3. Condivisione dei dati con terze parti
          </Title>
          <Text>
            Non vendiamo, affittiamo né cediamo i tuoi dati personali a terze
            parti. I dati possono essere condivisi esclusivamente con:
          </Text>
          <Stack gap="xs" pl="md">
            <Text>
              • <strong>Google LLC / Google Ireland Limited</strong>: come
              provider del servizio di autenticazione OAuth.
            </Text>
            <Text>
              • <strong>Provider di infrastruttura cloud</strong>: per
              l&apos;hosting e la memorizzazione dei dati (es. server database),
              vincolati da accordi di riservatezza.
            </Text>
            <Text>
              • <strong>Autorità competenti</strong>: solo se richiesto dalla
              legge applicabile.
            </Text>
          </Stack>
        </Stack>

        {/* 4 */}
        <Stack gap="sm">
          <Title order={2} size="h4">
            4. Conservazione dei dati
          </Title>
          <Text>
            I dati del tuo profilo vengono conservati per tutta la durata del
            tuo account. Puoi richiedere la cancellazione del tuo account e di
            tutti i dati associati in qualsiasi momento scrivendo a{" "}
            <Anchor href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</Anchor>.
            La cancellazione avviene entro 30 giorni dalla richiesta.
          </Text>
        </Stack>

        {/* 5 */}
        <Stack gap="sm">
          <Title order={2} size="h4">
            5. Sicurezza
          </Title>
          <Text>
            Adottiamo misure tecniche e organizzative adeguate per proteggere i
            tuoi dati da accessi non autorizzati, perdita o divulgazione. Le
            comunicazioni tra il tuo browser e i nostri server avvengono tramite
            protocollo HTTPS.
          </Text>
        </Stack>

        {/* 6 */}
        <Stack gap="sm">
          <Title order={2} size="h4">
            6. Diritti dell&apos;utente (GDPR)
          </Title>
          <Text>
            Se sei un utente residente nello Spazio Economico Europeo, hai
            diritto a:
          </Text>
          <Stack gap="xs" pl="md">
            <Text>• Accedere ai tuoi dati personali</Text>
            <Text>• Rettificarli o aggiornarli</Text>
            <Text>
              • Richiederne la cancellazione (&quot;diritto
              all&apos;oblio&quot;)
            </Text>
            <Text>• Opporti al trattamento</Text>
            <Text>• Richiedere la portabilità dei dati</Text>
          </Stack>
          <Text>
            Per esercitare questi diritti, contattaci all&apos;indirizzo:{" "}
            <Anchor href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</Anchor>.
          </Text>
        </Stack>

        {/* 7 */}
        <Stack gap="sm">
          <Title order={2} size="h4">
            7. Cookie e tecnologie di tracciamento
          </Title>
          <Text>
            Utilizziamo cookie tecnici strettamente necessari per mantenere la
            sessione di autenticazione (es. session token). Non utilizziamo
            cookie di profilazione o di tracciamento pubblicitario.
          </Text>
        </Stack>

        {/* 8 */}
        <Stack gap="sm">
          <Title order={2} size="h4">
            8. Modifiche alla presente informativa
          </Title>
          <Text>
            Ci riserviamo il diritto di aggiornare questa informativa. In caso
            di modifiche sostanziali, ne daremo comunicazione tramite email o
            avviso nell&apos;applicazione prima che entrino in vigore.
          </Text>
        </Stack>

        {/* 9 */}
        <Stack gap="sm">
          <Title order={2} size="h4">
            9. Contatti
          </Title>
          <Text>
            Per qualsiasi domanda relativa a questa informativa o al trattamento
            dei tuoi dati, puoi scriverci a:{" "}
            <Anchor href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</Anchor>.
          </Text>
        </Stack>

        <Divider />

        <Text size="sm" c="dimmed">
          Questa pagina non è inclusa nella navigazione principale ed è
          accessibile all&apos;indirizzo{" "}
          <Anchor href={`${APP_URL}/privacy`} size="sm">
            {APP_URL}/privacy
          </Anchor>
          . Il link deve essere inserito nell&apos;OAuth Consent Screen su
          Google Cloud Console.
        </Text>
      </Stack>
    </Container>
  );
}
