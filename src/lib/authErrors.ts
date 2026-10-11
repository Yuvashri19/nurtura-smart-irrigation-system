export function getAuthErrorMessage(errorCode: string, rawMessage?: string): string {
  switch (errorCode) {
    case 'auth/operation-not-allowed':
      return 'Email/Password sign-in is not enabled in Firebase Console. Please enable "Email/Password" under Firebase Console > Authentication > Sign-in method for project gen-lang-client-0842902664. In the meantime, you can use Demo Mode below.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Please switch to the Sign In tab.';
    case 'auth/invalid-email':
      return 'The email address provided is not a valid email format.';
    case 'auth/weak-password':
      return 'The password is too weak. Firebase requires at least 6 characters.';
    case 'auth/user-not-found':
      return 'No account found with this email address. Please click Create Account.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please verify your password.';
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please verify your credentials or create an account.';
    case 'auth/too-many-requests':
      return 'Access temporarily blocked due to multiple failed login attempts. Please wait a moment.';
    case 'auth/network-request-failed':
      return 'Network connection failed. Unable to reach Firebase Authentication servers.';
    case 'auth/user-disabled':
      return 'This user account has been disabled by an administrator.';
    case 'auth/internal-error':
      return 'An internal Firebase error occurred. Please try again.';
    default:
      if (rawMessage) {
        return `${rawMessage} (${errorCode || 'auth/unknown'})`;
      }
      return `Authentication failed (${errorCode || 'auth/unknown'}). Please check your credentials.`;
  }
}

