import AuthForm from '../components/Authform';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold text-center text-blue-600 mb-2">CampusBridge</h1>
        <p className="text-center text-gray-500 mb-8">Sign in to access your student dashboard</p>
        
        {/* We use AuthForm here as the component name */}
        <AuthForm />
      </div>
    </main>
  );
}