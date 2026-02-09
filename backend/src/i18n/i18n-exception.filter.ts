import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';
import { I18nService } from './i18n.service';

@Catch(HttpException)
export class I18nExceptionFilter implements ExceptionFilter {
  constructor(private readonly i18nService: I18nService) { }

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();
    const status = exception.getStatus();

    const acceptLanguage = request?.headers?.['accept-language'] as string;
    const lang = this.i18nService.parseLanguageFromHeader(acceptLanguage);

    const exceptionResponse = exception.getResponse() as any;

    // Handle exceptions with string message (Conflict, Forbidden, NotFound, Unauthorized, BadRequest)
    if (
      typeof exceptionResponse.message === 'string' &&
      (exception instanceof ConflictException ||
        exception instanceof ForbiddenException ||
        exception instanceof NotFoundException ||
        exception instanceof UnauthorizedException ||
        exception instanceof BadRequestException)
    ) {
      const message = exceptionResponse.message;
      const translatedMessage = this.translateErrorMessage(message, lang);

      // Debug logging (remove in production if needed)
      if (process.env.NODE_ENV === 'development') {
        console.log(`Translating error: "${message}" -> "${translatedMessage}" (lang: ${lang})`);
      }

      response.status(status).json({
        statusCode: status,
        message: translatedMessage,
        error: exceptionResponse.error || exception.name,
      });
      return;
    }

    // Check if this is a validation error (array of messages)
    if (
      exceptionResponse.message &&
      Array.isArray(exceptionResponse.message) &&
      exceptionResponse.message.length > 0
    ) {
      // Check if messages are validation errors (class-validator returns objects with constraints)
      const messages = exceptionResponse.message.map((error: any) => {
        // Handle class-validator error objects
        if (typeof error === 'object' && error.constraints) {
          const constraints = error.constraints;
          const property = error.property || 'field';
          const constraintKey = Object.keys(constraints)[0];
          const constraintValue = constraints[constraintKey];

          // Extract constraint value from error context (for MinLength, MaxLength, Min, Max, etc.)
          const constraintNum = this.extractConstraintValueFromError(error, constraintKey);

          // Check if it's a custom validation message starting with validation.
          if (constraintValue && constraintValue.startsWith('validation.')) {
            const translationKey = constraintValue.replace('validation.', '');
            return this.i18nService.getValidationMessage(translationKey, property, lang, {
              constraint: constraintNum,
            });
          }

          // Map class-validator constraint to our translation key
          const translationKey = this.mapConstraintToKey(constraintKey, constraintValue);
          return this.i18nService.getValidationMessage(translationKey, property, lang, {
            constraint: constraintNum,
          });
        }

        // Handle string messages (fallback)
        if (typeof error === 'string') {
          // If it's already a custom validation message starting with validation., translate it
          if (error.startsWith('validation.')) {
            const translationKey = error.replace('validation.', '');
            return this.i18nService.getValidationMessage(translationKey, 'field', lang);
          }

          // Try to parse standard class-validator messages
          if (error.includes('must be') || error.includes('should be')) {
            const propertyMatch = error.match(/^(\w+)\s/);
            const property = propertyMatch ? propertyMatch[1] : 'field';

            // Map common validation messages
            if (error.includes('must be a string')) {
              return this.i18nService.getValidationMessage('isString', property, lang);
            }
            if (error.includes('must be an email')) {
              return this.i18nService.getValidationMessage('isEmail', property, lang);
            }
            if (error.includes('must be a boolean')) {
              return this.i18nService.getValidationMessage('isBoolean', property, lang);
            }
            if (error.includes('must be a number')) {
              return this.i18nService.getValidationMessage('isNumber', property, lang);
            }
            if (error.includes('must be an array')) {
              return this.i18nService.getValidationMessage('isArray', property, lang);
            }
            if (error.includes('should not be empty')) {
              return this.i18nService.getValidationMessage('isNotEmpty', property, lang);
            }

            // Check for minLength
            const minLengthMatch = error.match(/must be longer than or equal to (\d+)/);
            if (minLengthMatch) {
              return this.i18nService.getValidationMessage('minLength', property, lang, {
                constraint: minLengthMatch[1],
              });
            }

            // Check for maxLength
            const maxLengthMatch = error.match(/must be shorter than or equal to (\d+)/);
            if (maxLengthMatch) {
              return this.i18nService.getValidationMessage('maxLength', property, lang, {
                constraint: maxLengthMatch[1],
              });
            }

            // Check for min
            const minMatch = error.match(/must not be less than (\d+)/);
            if (minMatch) {
              return this.i18nService.getValidationMessage('min', property, lang, {
                constraint: minMatch[1],
              });
            }
          }
        }

        return error;
      });

      response.status(status).json({
        statusCode: status,
        message: messages,
        error: 'Bad Request',
      });
    } else {
      // Not a validation error, return as is
      response.status(status).json(exceptionResponse);
    }
  }

  private mapConstraintToKey(constraintKey: string, constraintValue: string): string {
    const mapping: Record<string, string> = {
      isNotEmpty: 'isNotEmpty',
      isString: 'isString',
      isEmail: 'isEmail',
      isBoolean: 'isBoolean',
      isNumber: 'isNumber',
      isEnum: 'isEnum',
      isArray: 'isArray',
      isIn: 'isIn',
      minLength: 'minLength',
      maxLength: 'maxLength',
      min: 'min',
      max: 'max',
    };

    return mapping[constraintKey] || constraintKey;
  }

  private extractConstraintValue(constraintKey: string, constraintValue: string): string {
    const match = constraintValue.match(/\d+/);
    return match ? match[0] : '';
  }

  /**
   * Extracts constraint value from class-validator error object.
   * For MinLength, MaxLength, Min, Max, etc., extracts the numeric value.
   */
  private extractConstraintValueFromError(error: any, constraintKey: string): string {
    // Try to get constraint value from error.contexts (class-validator stores constraints here)
    if (error.contexts && error.contexts[constraintKey]) {
      const context = error.contexts[constraintKey];

      // class-validator stores constraint values in context.constraints array
      if (context.constraints && Array.isArray(context.constraints)) {
        if (context.constraints[0] !== undefined) {
          return context.constraints[0].toString();
        }
      }

      // Alternative: check for direct properties
      if (context.min !== undefined) return context.min.toString();
      if (context.max !== undefined) return context.max.toString();
      if (context.value !== undefined) return context.value.toString();
    }

    // Try to extract from constraint value string (fallback)
    const constraintValue = error.constraints?.[constraintKey];
    if (constraintValue && typeof constraintValue === 'string') {
      const match = constraintValue.match(/\d+/);
      if (match) {
        return match[0];
      }
    }

    return '';
  }

  /**
   * Translates error messages from services.
   * If message is a translation key (errors.xxx, messages.xxx), translates by key.
   * Otherwise maps hardcoded English messages to translation keys (legacy).
   */
  private translateErrorMessage(message: string, lang: 'en' | 'pl'): string {
    // If message looks like a translation key (e.g. errors.profileNotFound, validation.nipInvalid), translate it
    if (message && (message.startsWith('errors.') || message.startsWith('messages.') || message.startsWith('validation.'))) {
      const translated = this.i18nService.translate(message, lang);
      if (translated !== message) return translated;
    }

    // Map of English error messages to translation keys (legacy)
    const errorMap: Record<string, string> = {
      'Passwords do not match': 'errors.passwordsDoNotMatch',
      'Terms and privacy policy must be accepted': 'errors.termsMustBeAccepted',
      'User with this email already exists': 'errors.userEmailExists',
      'Invalid email or password': 'errors.invalidEmailOrPassword',
      'Current password is required': 'errors.currentPasswordRequired',
      'Current password is incorrect': 'errors.currentPasswordIncorrect',
      'Invalid user': 'errors.invalidUser',
      'Invalid or expired reset token': 'errors.invalidResetToken',
    };

    const translationKey = errorMap[message];
    if (translationKey) {
      const translated = this.i18nService.translate(translationKey, lang);
      if (translated !== translationKey) return translated;
      console.warn(`Translation not found for key: ${translationKey}, language: ${lang}, message: ${message}`);
    } else if (process.env.NODE_ENV === 'development') {
      console.warn(`No translation key found for message: "${message}"`);
    }

    return message;
  }
}
