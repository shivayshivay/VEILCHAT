import { getApps } from "firebase/app";
import { firebaseAuth, isFirebaseConfigured } from "../firebase";
import { isSupabaseConfigured, supabase } from "../supabase";
import { env, isSocketEnvConfigured } from "../env";

export interface TestResult {
  name: string;
  passed: boolean;
  message: string;
}

export interface ConnectionTestReport {
  timestamp: string;
  results: TestResult[];
  passed: number;
  failed: number;
  total: number;
}

export async function testFirebaseConnection(): Promise<TestResult> {
  const name = "Firebase Connection";
  try {
    if (!isFirebaseConfigured) {
      return { name, passed: false, message: "Firebase env variables are not set." };
    }
    const apps = getApps();
    if (apps.length === 0) {
      return { name, passed: false, message: "Firebase app was not initialized." };
    }
    return { name, passed: true, message: `Firebase app initialized (projectId: ${apps[0].options.projectId}).` };
  } catch (error) {
    return { name, passed: false, message: `Firebase error: ${error instanceof Error ? error.message : String(error)}` };
  }
}

export async function testFirebaseAuthInit(): Promise<TestResult> {
  const name = "Firebase Auth Initialization";
  try {
    if (!isFirebaseConfigured) {
      return { name, passed: false, message: "Firebase is not configured." };
    }
    if (!firebaseAuth) {
      return { name, passed: false, message: "Firebase Auth instance is null." };
    }
    return { name, passed: true, message: "Firebase Auth initialized successfully." };
  } catch (error) {
    return { name, passed: false, message: `Auth init error: ${error instanceof Error ? error.message : String(error)}` };
  }
}

export async function testSupabaseConnection(): Promise<TestResult> {
  const name = "Supabase Connection";
  try {
    if (!isSupabaseConfigured || !supabase) {
      return { name, passed: false, message: "Supabase env variables are not set." };
    }
    const { error } = await supabase.from("users").select("id").limit(1);
    if (error) {
      return { name, passed: false, message: `Supabase query error: ${error.message}` };
    }
    return { name, passed: true, message: "Supabase connection successful." };
  } catch (error) {
    return { name, passed: false, message: `Supabase error: ${error instanceof Error ? error.message : String(error)}` };
  }
}

export async function testSocketEndpoint(): Promise<TestResult> {
  const name = "Socket Endpoint";
  if (!isSocketEnvConfigured) {
    return { name, passed: false, message: "EXPO_PUBLIC_SOCKET_URL is not set." };
  }
  return { name, passed: true, message: `Socket URL configured: ${env.api.socketUrl}` };
}

export async function runAllConnectionTests(): Promise<ConnectionTestReport> {
  const results = await Promise.all([
    testFirebaseConnection(),
    testFirebaseAuthInit(),
    testSupabaseConnection(),
    testSocketEndpoint(),
  ]);

  const passed = results.filter((r) => r.passed).length;
  const failed = results.length - passed;

  const report: ConnectionTestReport = {
    timestamp: new Date().toISOString(),
    results,
    passed,
    failed,
    total: results.length,
  };

  console.log("[connectionTests] ===== Connection Test Report =====");
  console.log(`[connectionTests] Timestamp: ${report.timestamp}`);
  results.forEach((r) => {
    const icon = r.passed ? "✅" : "❌";
    console.log(`[connectionTests] ${icon} ${r.name}: ${r.message}`);
  });
  console.log(`[connectionTests] Summary: ${passed}/${results.length} passed`);
  console.log("[connectionTests] =================================");

  return report;
}
