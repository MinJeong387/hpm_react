import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import DefaultLayout from "../layouts/DefaultLayout";
import "../css/LoginPage.css";

const API_URL = "http://localhost:8088/api/users/login";

const Login = () => {
  const [loginData, setLoginData] = useState({
    userId: "",
    password: "",
  });
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();
  const { setIsLoggedIn, setUser } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    const { userId, ...formDataToSend } = loginData;
    const formDataToSendWithUserId = { ...formDataToSend, user_id: userId };

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formDataToSendWithUserId),
      });

      if (!response.ok) {
        const errorText = await response.text();
        setErrorMsg("서버 오류: " + errorText);
        return;
      }

      const data = await response.json();
      setIsLoggedIn(true);
      setUser(data);
      navigate("/");
    } catch (error) {
      console.error("로그인 에러:", error);
      setErrorMsg("서버 오류 또는 네트워크 에러");
    }
  };

  return (
    <DefaultLayout
      headerProps={{
        showBack: true,
        title: "로그인",
        showIcons: { search: true },
      }}
    >
      <div className="login-body">
        <div className="login-container">
          <div className="login-left">
            <h2 className="login-title">Welcome!</h2>
            <form onSubmit={handleLogin} className="login-form">
              <div className="login-input-wrapper">
                <input
                  className="login-input"
                  type="text"
                  placeholder="아이디"
                  value={loginData.userId}
                  onChange={(e) =>
                    setLoginData({ ...loginData, userId: e.target.value })
                  }
                />
              </div>
              <div className="login-input-wrapper">
                <input
                  className="login-input"
                  type="password"
                  placeholder="비밀번호"
                  value={loginData.password}
                  onChange={(e) =>
                    setLoginData({ ...loginData, password: e.target.value })
                  }
                />
              </div>
              <p className="login-forgot">Forgot password?</p>
              {errorMsg && <p className="login-error">{errorMsg}</p>}
              <button className="login-button" type="submit" data-text="로그인">
                <span>로그인</span>
              </button>
            </form>
          </div>
          <div className="login-right">
            <div className="login-right-overlay">
              <p className="login-signup-text">계정이 없으신가요?</p>
              <button
                className="login-signup-button"
                onClick={() => navigate("/join")}
              >
                회원가입
              </button>
            </div>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
};

export default Login;
