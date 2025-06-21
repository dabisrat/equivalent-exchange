import { Appearance } from 'node_modules/@supabase/auth-ui-react/dist/types'
import { ThemeSupa } from '@supabase/auth-ui-shared'

export const authUiConfig: Appearance = {
    theme: ThemeSupa,
    variables: {
        default: {
            colors: {
                brand: 'var(--primary)',
                brandAccent: 'color-mix(in srgb, var(--primary) 90%, transparent)',
                brandButtonText: 'var(--primary-foreground)',
                defaultButtonBackground: 'var(--primary)',
                defaultButtonBackgroundHover: 'color-mix(in srgb, var(--primary) 90%, transparent)',
                defaultButtonText: 'var(--primary-foreground)',
                inputBackground: 'var(--background)',
                inputBorder: 'var(--border)',
                inputBorderHover: 'var(--ring)',
                inputBorderFocus: 'var(--ring)',
                inputText: 'var(--foreground)',
                inputLabelText: 'var(--foreground)',
                inputPlaceholder: 'var(--muted-foreground)',
                messageText: 'var(--foreground)',
                messageTextDanger: 'var(--destructive)',
                anchorTextColor: 'var(--primary)',
                dividerBackground: 'var(--border)',
            },
            space: {
                spaceSmall: '0.5rem',
                spaceMedium: '1rem',
                spaceLarge: '1.5rem',
                labelBottomMargin: '0.5rem',
                anchorBottomMargin: '0.5rem',
                emailInputSpacing: '0.5rem',
                socialAuthSpacing: '0.5rem',
                buttonPadding: '0.75rem',
                inputPadding: '0.75rem',
            },
            fonts: {
                bodyFontFamily: 'var(--font-sans)',
                buttonFontFamily: 'var(--font-sans)',
                inputFontFamily: 'var(--font-sans)',
                labelFontFamily: 'var(--font-sans)',
            },
            fontSizes: {
                baseBodySize: '0.875rem',
                baseInputSize: '0.875rem',
                baseLabelSize: '0.875rem',
                baseButtonSize: '0.875rem',
            },
            radii: {
                borderRadiusButton: 'var(--radius)',
                buttonBorderRadius: 'var(--radius)',
                inputBorderRadius: 'var(--radius)',
            },
            borderWidths: {
                buttonBorderWidth: '1px',
                inputBorderWidth: '1px',
            },
        },
        dark: {
            colors: {
                brand: 'var(--primary)',
                brandAccent: 'color-mix(in srgb, var(--primary) 90%, transparent)',
                brandButtonText: 'var(--primary-foreground)',
                defaultButtonBackground: 'var(--primary)',
                defaultButtonBackgroundHover: 'color-mix(in srgb, var(--primary) 90%, transparent)',
                defaultButtonText: 'var(--primary-foreground)',
                inputBackground: 'var(--background)',
                inputBorder: 'var(--border)',
                inputBorderHover: 'var(--ring)',
                inputBorderFocus: 'var(--ring)',
                inputText: 'var(--foreground)',
                inputLabelText: 'var(--foreground)',
                inputPlaceholder: 'var(--muted-foreground)',
                messageText: 'var(--foreground)',
                messageTextDanger: 'var(--destructive)',
                anchorTextColor: 'var(--primary)',
                dividerBackground: 'var(--border)',
            }
        }
    },
    style: {
        container: {
            padding: '1rem',
        }
    },
} 