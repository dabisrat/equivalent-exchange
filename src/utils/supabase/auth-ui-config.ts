import { Appearance } from '@supabase/auth-ui-react/dist/types'
import { ThemeSupa } from '@supabase/auth-ui-shared'

export const authUiConfig: Appearance = {
    theme: ThemeSupa,
    variables: {
        default: {
            colors: {
                brand: 'hsl(var(--primary))',
                brandAccent: 'hsl(var(--accent))',
                brandButtonText: 'hsl(var(--primary-foreground))',
                defaultButtonBackground: 'hsl(var(--secondary))',
                defaultButtonBackgroundHover: 'hsl(var(--accent))',
                inputBackground: 'hsl(var(--background))',
                inputBorder: 'hsl(var(--border))',
                inputBorderHover: 'hsl(var(--ring))',
                inputBorderFocus: 'hsl(var(--ring))',
                inputText: 'hsl(var(--foreground))',
                inputLabelText: 'hsl(var(--foreground))',
                inputPlaceholder: 'hsl(var(--muted-foreground))',
                messageText: 'hsl(var(--foreground))',
                messageTextDanger: 'hsl(var(--destructive))',
                anchorTextColor: 'hsl(var(--primary))',
                dividerBackground: 'hsl(var(--border))',
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
                brand: 'hsl(var(--primary))',
                brandAccent: 'hsl(var(--accent))',
                brandButtonText: 'hsl(var(--primary-foreground))',
                defaultButtonBackground: 'hsl(var(--secondary))',
                defaultButtonBackgroundHover: 'hsl(var(--accent))',
                inputBackground: 'hsl(var(--background))',
                inputBorder: 'hsl(var(--border))',
                inputBorderHover: 'hsl(var(--ring))',
                inputBorderFocus: 'hsl(var(--ring))',
                inputText: 'hsl(var(--foreground))',
                inputLabelText: 'hsl(var(--foreground))',
                inputPlaceholder: 'hsl(var(--muted-foreground))',
                messageText: 'hsl(var(--foreground))',
                messageTextDanger: 'hsl(var(--destructive))',
                anchorTextColor: 'hsl(var(--primary))',
                dividerBackground: 'hsl(var(--border))',
            }
        }
    },
    style: {
        container: {
            padding: '1rem',
        }
    },
}