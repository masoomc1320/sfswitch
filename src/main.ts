import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { AppComponent } from './app/app.component';
import { SF_CONFIG, SfConfig } from './app/sf-config';

async function main() {
  const cfg = (await fetch('/assets/config.json').then((r) => r.json())) as SfConfig;
  await bootstrapApplication(AppComponent, {
    providers: [
      provideHttpClient(withFetch()),
      { provide: SF_CONFIG, useValue: cfg },
    ],
  });
}

main().catch((err) => console.error(err));

