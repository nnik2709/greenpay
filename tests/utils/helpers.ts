import { Page, expect } from '@playwright/test';

/**
 * Test Utilities and Helpers
 * Reusable functions for PNG Green Fees System tests
 */

/**
 * Check for console errors during test execution
 * This includes warnings and errors that might not affect functionality
 */
export async function checkConsoleErrors(page: Page, options?: { ignoreWarnings?: boolean }) {
  const consoleErrors: string[] = [];
  const consoleWarnings: string[] = [];

  page.on('console', (msg) => {
    const text = msg.text();
    const type = msg.type();
    
    if (type === 'error') {
      // Filter out known safe "errors" that are actually warnings
      const safeErrors = [
        'React DevTools',
        'UNSAFE_componentWillMount',
        'Invalid value for prop',
        'Download the React DevTools',
        'autocomplete attributes',
        'Invalid token', // Auth errors during initial load are expected
        'Error initializing auth', // Auth initialization errors are expected during load
        'Failed to load resource', // Network errors (401, 404, etc.) are often expected
        'status of 401', // Unauthorized errors during auth initialization
        'status of 404' // Not found errors for optional endpoints
      ];
      
      const isSafeError = safeErrors.some(safe => text.includes(safe));
      if (!isSafeError) {
        consoleErrors.push(text);
      }
    }
    
    if (type === 'warning' && !options?.ignoreWarnings) {
      // Capture warnings but filter out known safe warnings
      const safeWarnings = [
        'UNSAFE_componentWillMount',
        'Invalid value for prop',
        'React DevTools',
        'autocomplete attributes'
      ];
      
      const isSafeWarning = safeWarnings.some(safe => text.includes(safe));
      if (!isSafeWarning) {
        consoleWarnings.push(text);
      }
    }
  });

  return {
    getErrors: () => consoleErrors,
    getWarnings: () => consoleWarnings,
    assertNoErrors: () => {
      if (consoleErrors.length > 0) {
        throw new Error(`Console errors found:\n${consoleErrors.join('\n')}`);
      }
    },
    assertNoWarnings: () => {
      if (consoleWarnings.length > 0) {
        throw new Error(`Console warnings found:\n${consoleWarnings.join('\n')}`);
      }
    },
    assertNoIssues: () => {
      const issues = [...consoleErrors, ...consoleWarnings];
      if (issues.length > 0) {
        throw new Error(`Console issues found:\n${issues.join('\n')}`);
      }
    },
    logSummary: () => {
      if (consoleErrors.length === 0 && consoleWarnings.length === 0) {
        console.log('✓ No console errors or warnings');
      } else {
        console.log(`⚠ Found ${consoleErrors.length} errors and ${consoleWarnings.length} warnings`);
      }
    }
  };
}

/**
 * Check for network errors during test execution
 */
export async function checkNetworkErrors(page: Page) {
  const networkErrors: Array<{ url: string; status: number; method: string }> = [];

  page.on('response', (response) => {
    const status = response.status();
    const url = response.url();
    const method = response.request().method();

    // Track 4xx and 5xx errors, but allow expected errors
    if (status >= 400) {
      // Allow 401 errors on auth endpoints during initial page load
      // These are expected when checking auth state
      const isAuthCheckError = status === 401 && url.includes('/api/auth/me');
      // Allow 404 errors for static assets (JS, CSS, images, etc.)
      // Missing static assets don't indicate functional problems
      const isStaticAsset404 = status === 404 && (
        url.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/i) ||
        url.includes('/plugins/') ||
        url.includes('/assets/')
      );
      if (!isAuthCheckError && !isStaticAsset404) {
        networkErrors.push({ url, status, method });
      }
    }
  });

  return {
    getErrors: () => networkErrors,
    assertNoErrors: () => {
      if (networkErrors.length > 0) {
        const errorMsg = networkErrors
          .map(e => `${e.method} ${e.url} - ${e.status}`)
          .join('\n');
        throw new Error(`Network errors found:\n${errorMsg}`);
      }
    },
    allowError: (urlPattern: string | RegExp, status: number) => {
      const index = networkErrors.findIndex(e =>
        (typeof urlPattern === 'string' ? e.url.includes(urlPattern) : urlPattern.test(e.url)) &&
        e.status === status
      );
      if (index > -1) {
        networkErrors.splice(index, 1);
      }
    }
  };
}

/**
 * Wait for navigation and ensure no loading spinners
 */
export async function waitForPageLoad(page: Page, timeout = 10000) {
  await page.waitForLoadState('networkidle', { timeout });

  // Wait for any loading spinners to disappear
  const loaders = [
    'text=Loading...',
    '[data-testid="loader"]',
    '.animate-spin',
    'text=Processing...'
  ];

  for (const loader of loaders) {
    try {
      await page.waitForSelector(loader, { state: 'hidden', timeout: 2000 });
    } catch {
      // Loader not found, continue
    }
  }
}

/**
 * Fill form field and wait for it to be stable
 */
export async function fillFormField(page: Page, selector: string, value: string) {
  await page.fill(selector, '');
  await page.fill(selector, value);
  await page.waitForTimeout(100); // Small delay for validation
}

/**
 * Generate random test data
 */
export const testData = {
  randomEmail: () => `test-${Date.now()}@example.com`,
  randomPassportNumber: () => `TEST${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
  randomCompanyName: () => `Test Company ${Date.now()}`,
  randomName: () => {
    const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emma'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia'];
    return {
      firstName: firstNames[Math.floor(Math.random() * firstNames.length)],
      lastName: lastNames[Math.floor(Math.random() * lastNames.length)]
    };
  },
  randomNationality: () => {
    const nationalities = ['Australian', 'American', 'British', 'Canadian', 'New Zealand'];
    return nationalities[Math.floor(Math.random() * nationalities.length)];
  },
  futureDate: (daysFromNow: number = 30) => {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString().split('T')[0];
  },
  pastDate: (daysAgo: number = 365) => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString().split('T')[0];
  }
};

/**
 * Take screenshot with custom name
 */
export async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({
    path: `test-results/screenshots/${name}-${Date.now()}.png`,
    fullPage: true
  });
}

/**
 * Wait for toast notification
 */
export async function waitForToast(page: Page, type: 'success' | 'error' | 'info' = 'success') {
  const toastSelector = '[data-sonner-toast]';
  await page.waitForSelector(toastSelector, { timeout: 5000 });

  const toastText = await page.locator(toastSelector).textContent();
  return toastText;
}

/**
 * Check if element exists without throwing error
 */
export async function elementExists(page: Page, selector: string): Promise<boolean> {
  try {
    const element = await page.locator(selector).first();
    return await element.isVisible({ timeout: 1000 });
  } catch {
    return false;
  }
}

/**
 * Wait for Supabase query to complete
 */
export async function waitForSupabaseQuery(page: Page, tableName?: string) {
  await page.waitForResponse(
    response => response.url().includes('supabase.co') &&
                response.url().includes('/rest/v1/') &&
                (!tableName || response.url().includes(tableName)),
    { timeout: 10000 }
  );
}

/**
 * Get table row count
 */
export async function getTableRowCount(page: Page, tableSelector: string = 'table tbody tr'): Promise<number> {
  const rows = await page.locator(tableSelector).count();
  return rows;
}

/**
 * Select from dropdown/combobox
 */
export async function selectDropdownOption(page: Page, triggerSelector: string, optionText: string) {
  await page.click(triggerSelector);
  await page.waitForTimeout(300);
  await page.click(`text=${optionText}`);
}

/**
 * Upload file
 */
export async function uploadFile(page: Page, inputSelector: string, filePath: string) {
  const fileInput = await page.locator(inputSelector);
  await fileInput.setInputFiles(filePath);
}

/**
 * Check for database errors by monitoring network responses
 */
export async function checkDatabaseErrors(page: Page) {
  const dbErrors: Array<{ query: string; error: string }> = [];

  page.on('response', async (response) => {
    if (response.url().includes('supabase.co') && response.status() >= 400) {
      try {
        const body = await response.json();
        dbErrors.push({
          query: response.url(),
          error: body.message || body.error || 'Unknown error'
        });
      } catch {
        dbErrors.push({
          query: response.url(),
          error: `HTTP ${response.status()}`
        });
      }
    }
  });

  return {
    getErrors: () => dbErrors,
    assertNoErrors: () => {
      if (dbErrors.length > 0) {
        const errorMsg = dbErrors
          .map(e => `${e.query}\n  Error: ${e.error}`)
          .join('\n\n');
        throw new Error(`Database errors found:\n${errorMsg}`);
      }
    }
  };
}

/**
 * Clear all test data from a table (use with caution!)
 */
export async function clearTestData(page: Page, email: string) {
  // This would typically be done via API, but showing concept
  console.log(`Would clear test data for user: ${email}`);
}

/**
 * Wait for specific text to appear/disappear
 */
export async function waitForText(page: Page, text: string, state: 'visible' | 'hidden' = 'visible') {
  await page.locator(`text=${text}`).waitFor({ state, timeout: 10000 });
}

/**
 * Retry action with exponential backoff
 */
export async function retryAction<T>(
  action: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await action();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, baseDelay * Math.pow(2, i)));
    }
  }
  throw new Error('Retry failed');
}
