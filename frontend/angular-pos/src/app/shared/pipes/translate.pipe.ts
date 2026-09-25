import { Pipe, PipeTransform } from '@angular/core';
import { TranslationService } from '../../core/services/translation.service';

@Pipe({
  name: 'translate',
  standalone: true,
  pure: false
})
export class TranslatePipe implements PipeTransform {
  constructor(private translationService: TranslationService) {}

  transform(key: string, params?: Record<string, any>): string {
    return this.translationService.t(key, params);
  }
}
