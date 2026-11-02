import {bootstrapApplication} from '@angular/platform-browser';
import {App} from './app/app';
import {appConfig} from './app/app.config';

// eslint-disable-next-line unicorn/prefer-top-level-await, @typescript-eslint/use-unknown-in-catch-callback-variable
bootstrapApplication(App, appConfig).catch((error) => { console.error(error); });
