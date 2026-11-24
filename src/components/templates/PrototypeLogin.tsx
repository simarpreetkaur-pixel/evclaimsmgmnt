'use client';

import { useEffect, useRef, useState, type ClipboardEvent, type FormEvent, type KeyboardEvent } from 'react';

import { AppImage } from '@/components/atoms/AppImage';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

type PrototypeLoginProps = {
  onSignIn: (email: string) => void;
};

type LoginStep = 'email' | 'otp';

const OTP_LENGTH = 4;
const RESEND_SECONDS = 30;
const DEFAULT_PROTOTYPE_EMAIL = 'mesimarpreet@gmail.com';

export function PrototypeLogin({ onSignIn }: PrototypeLoginProps) {
  const [step, setStep] = useState<LoginStep>('email');
  const [email, setEmail] = useState(DEFAULT_PROTOTYPE_EMAIL);
  const [otpDigits, setOtpDigits] = useState<string[]>(() => Array(OTP_LENGTH).fill(''));
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [error, setError] = useState('');
  const otpInputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const handleEmailSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextEmail = email.trim();
    if (!nextEmail) {
      setError('Enter an email address.');
      return;
    }

    setEmail(nextEmail);
    setOtpDigits(Array(OTP_LENGTH).fill(''));
    setSecondsLeft(RESEND_SECONDS);
    setError('');
    setStep('otp');
  };

  useEffect(() => {
    if (step !== 'otp' || secondsLeft <= 0) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setSecondsLeft((current) => current - 1);
    }, 1000);

    return () => window.clearTimeout(timeout);
  }, [secondsLeft, step]);

  const submitOtp = (digits: string[]) => {
    if (digits.some((digit) => digit.length === 0)) {
      return;
    }

    setError('');
    onSignIn(email);
  };

  const handleOtpChange = (index: number, value: string) => {
    const nextCharacter = value.slice(-1);
    const nextDigits = [...otpDigits];
    nextDigits[index] = nextCharacter;
    setOtpDigits(nextDigits);

    if (nextCharacter && index < OTP_LENGTH - 1) {
      otpInputsRef.current[index + 1]?.focus();
    }

    submitOtp(nextDigits);
  };

  const handleOtpKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (index: number, event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData('text').trim().slice(0, OTP_LENGTH - index).split('');
    if (pasted.length === 0) {
      return;
    }

    const nextDigits = [...otpDigits];
    pasted.forEach((character, offset) => {
      nextDigits[index + offset] = character;
    });
    setOtpDigits(nextDigits);
    const nextIndex = Math.min(index + pasted.length, OTP_LENGTH - 1);
    otpInputsRef.current[nextIndex]?.focus();
    submitOtp(nextDigits);
  };

  const handleResendOtp = () => {
    setOtpDigits(Array(OTP_LENGTH).fill(''));
    setSecondsLeft(RESEND_SECONDS);
    otpInputsRef.current[0]?.focus();
  };

  return (
    <main className="bg-background grid min-h-screen lg:grid-cols-2">
      <section className="flex items-center justify-center px-6 py-12">
        <div className="flex w-full max-w-sm flex-col gap-8">
          <AppImage
            src="/images/acko-enterprise-logo.svg"
            alt="ACKO Enterprise"
            width={166}
            height={40}
          />

          {step === 'email' ? (
            <form className="flex flex-col gap-6" onSubmit={handleEmailSubmit} noValidate>
              <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">Sign in to Partner Portal</h1>
                <p className="text-muted-foreground text-sm">
                  Enter any email address. This prototype accepts every address.
                </p>
              </div>
              <FieldGroup>
                <Field data-invalid={Boolean(error) || undefined}>
                  <FieldLabel htmlFor="prototype-email">Email address</FieldLabel>
                  <Input
                    id="prototype-email"
                    name="email"
                    type="text"
                    inputMode="email"
                    autoComplete="username"
                    autoFocus
                    placeholder="Your email address"
                    value={email}
                    aria-invalid={Boolean(error) || undefined}
                    className="h-10"
                    onChange={(event) => {
                      setEmail(event.target.value);
                      if (error) setError('');
                    }}
                  />
                  {error ? <FieldError>{error}</FieldError> : null}
                </Field>
              </FieldGroup>
              <Button type="submit" size="lg" className="w-full">
                Continue
              </Button>
            </form>
          ) : (
            <form
              className="flex flex-col gap-6"
              onSubmit={(event) => {
                event.preventDefault();
                submitOtp(otpDigits);
              }}
              noValidate
            >
              <div className="flex flex-col gap-2">
                <h1 className="text-[22px] leading-9 font-semibold text-[#040222]">
                  Enter verification code
                </h1>
                <p className="text-base leading-snug text-[#5B5675]">
                  OTP has been sent to {email}
                </p>
              </div>
              <div className="flex gap-5">
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(element) => {
                      otpInputsRef.current[index] = element;
                    }}
                    aria-label={`OTP digit ${index + 1}`}
                    autoComplete={index === 0 ? 'one-time-code' : 'off'}
                    autoFocus={index === 0}
                    className="size-[60px] rounded-lg border border-[#E0E0E8] text-center text-base text-[#040222] outline-none placeholder:text-xl placeholder:text-[#f0f0f6] focus:border-[#696969]"
                    inputMode="text"
                    maxLength={1}
                    placeholder="●"
                    type="text"
                    value={digit}
                    onChange={(event) => handleOtpChange(index, event.target.value)}
                    onKeyDown={(event) => handleOtpKeyDown(index, event)}
                    onPaste={(event) => handleOtpPaste(index, event)}
                  />
                ))}
              </div>
              {secondsLeft > 0 ? (
                <p className="text-base text-[#5B5675]">
                  Resend OTP in 00:{secondsLeft.toString().padStart(2, '0')}
                </p>
              ) : (
                <button
                  type="button"
                  className="w-fit text-base text-[#1B73E8]"
                  onClick={handleResendOtp}
                >
                  Resend OTP
                </button>
              )}
            </form>
          )}
        </div>
      </section>

      <aside
        className="hidden min-h-screen items-center justify-center bg-[linear-gradient(180deg,#efe9fb_0%,rgba(239,233,251,0)_100%)] lg:flex"
        aria-hidden
      >
        <img src="/images/login-bg.svg" alt="" className="h-auto w-full max-w-[400px]" />
      </aside>
    </main>
  );
}
