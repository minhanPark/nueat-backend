import { Inject, Injectable } from '@nestjs/common';
import { CONFIG_OPTIONS } from 'src/common/common.constants';
import got from 'got';
import * as FormData from 'form-data';
import { EmailVar, MailModuleOptions } from './mail.interfaces';

@Injectable()
export class MailService {
  constructor(
    @Inject(CONFIG_OPTIONS) private readonly options: MailModuleOptions,
  ) {
    //this.sendEmail('test', 'test email')
  }
  private async sendEmail(
    subject: string,
    template: string,
    emailVars: EmailVar[],
  ) {
    const form = new FormData();
    form.append('from', `Excited User <mailgun@${this.options.domain}>`);
    form.append('to', 'alsgks1218@naver.com');
    form.append('subject', subject);
    form.append('template', template);
    emailVars.forEach((evar) => form.append(`v:${evar.key}`, evar.value));
    try {
      await got(`https://api.mailgun.net/v3/${this.options.domain}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(
            `api:${this.options.apiKey}`,
          ).toString('base64')}`,
        },
        body: form,
      });
    } catch (error) {
      console.log(error);
    }
  }

  sendVerificationEmail(email: string, code: string) {
    this.sendEmail('Verify Your Email', 'verify-email', [
      { key: 'code', value: code },
      { key: 'username', value: email },
    ]);
  }
}
