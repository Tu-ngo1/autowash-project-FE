import { useState } from 'react';
import { sendForgotPasswordOtp, verifyForgotPasswordOtp, resetPassword } from '../services/authApi';
import { useNavigate } from 'react-router-dom';

const ForgotPasswordPage = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSendOtp = async () => {
    try {
      await sendForgotPasswordOtp(email);
      setStep(2);
      setError('');
    } catch (e) {
      setError(e.message || 'Gửi OTP thất bại');
    }
  };

  const handleVerifyOtp = async () => {
    try {
      await verifyForgotPasswordOtp(email, otp);
      setStep(3);
      setError('');
    } catch (e) {
      setError(e.message || 'Xác thực OTP thất bại');
    }
  };

  const handleResetPassword = async () => {
    try {
      await resetPassword({ email, otp, newPassword });
      setError('');
      navigate('/login');
    } catch (e) {
      setError(e.message || 'Đặt lại mật khẩu thất bại');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-semibold text-center mb-6">Quên mật khẩu</h1>
        {error && <p className="text-red-600 text-center mb-4">{error}</p>}
        {step === 1 && (
          <>
            <label className="block text-sm font-medium mb-2">Email đăng ký</label>
            <input
              type="email"
              className="w-full px-3 py-2 border rounded mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button
              className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition"
              onClick={handleSendOtp}
            >
              Gửi OTP
            </button>
          </>
        )}
        {step === 2 && (
          <>
            <label className="block text-sm font-medium mb-2">Mã OTP</label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
            <button
              className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition"
              onClick={handleVerifyOtp}
            >
              Xác thực OTP
            </button>
          </>
        )}
        {step === 3 && (
          <>
            <label className="block text-sm font-medium mb-2">Mật khẩu mới</label>
            <input
              type="password"
              className="w-full px-3 py-2 border rounded mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <button
              className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition"
              onClick={handleResetPassword}
            >
              Đặt lại mật khẩu
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
