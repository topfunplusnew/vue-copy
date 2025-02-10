<template>
  <div class="home">
    <!-- 改进后的 Header -->
    <header class="header">
      <div class="nav-container">
        <div class="left-nav">
          <router-link :to="{ name: 'home' }"><el-button class="nav-button">HOME</el-button></router-link>
          <router-link :to="{ name: 'about' }"><el-button class="nav-button">ABOUT</el-button></router-link>
          <router-link :to="{ name: 'blog' }"><el-button class="nav-button">BLOG</el-button></router-link>
          <router-link :to="{ name: 'contact' }"><el-button class="nav-button">CONTACT</el-button></router-link>
        </div>
        <div class="right-nav">
          <wallet-item />
          <router-link :to="{ name: 'login' }"><el-button class="nav-button">Login</el-button></router-link>
          <router-link :to="{ name: 'signup' }"><el-button class="nav-button">Sign Up</el-button></router-link>
          <router-link :to="{ name: 'userpage' }"><el-button class="nav-button">User Page</el-button></router-link>
        </div>
      </div>

      <h1 class="header-title">{{ msg }}</h1>
    </header>

    <!-- 欢迎语 -->
    <h2 class="welcome-text">Welcome to iPoloGO!</h2>

    <!-- 登录表单部分 -->
    <div class="login-container">
      <div class="login-form">
        <h2>Login</h2>
        <form @submit.prevent="handleSubmit">
          <input type="text" v-model="username" placeholder="Username" required />
          <input type="password" v-model="password" placeholder="Password" required />
          <button type="submit">Login</button>
        </form>

        <!-- 忘记密码和注册链接 -->
        <div class="links-container">
          <router-link to="/forgetpassword" class="forgot-password-link">Forgot Password?</router-link>
          <router-link to="/signup" class="signup-link">Sign up</router-link>
        </div>

        <!-- 分割线和or -->
        <div class="or-divider">
          <span>or</span>
        </div>
        <!-- 新添加的文本 -->
        <p class="quick-login-text">Quick login in the following ways:</p>

        <!-- 快捷登录模块 -->
        <div class="social-login">
          <button class="social-button wechat">WeChat</button>
          <button class="social-button google">Google</button>
          <button class="social-button apple">Apple</button>
        </div>
      </div>
    </div>
  </div>
</template>