<template>
  <transition name="fade">
    <div id="ual-modal">
      <div id="ual-modal-selection-content">
        <span @click="$emit('close')" class="ual-modal-close">×</span>
        <h3>Please select a service</h3>
        <div>
          <div
            v-for="w in walletList"
            :key="w.text"
            @click="login(w)"
            class="ual-auth-button"
            :style="'background-color:' + w.background"
          >
            <div class="ual-auth-icon-wrapper"><img class="ual-auth-icon" :src="w.icon"></div>
            <div class="ual-auth-text" :style="'color:'+w.textColor">{{w.text}}</div>
            <div :class="w.loading?'spinner':''"></div>
          </div>
        </div>
        <transition name="fade">
          <div style="font-style:italic;" v-if="loginMessage" v-html="loginMessage"></div>
        </transition>
      </div>
    </div>
  </transition>
</template>
<script>
import { UAL } from "universal-authenticator-library";
export default {
  name: "ual-vuejs-example",
  props: ["chains", "wallets", "appName"],
  data() {
    return {
      walletList: [],
      loginMessage: "",
      vshow: false,
      account: null,
      ual: null,
      authenticator: null
    };
  },
  mounted() {
    this.wallets.forEach(w => {
      let obj = w.getStyle();
      obj.loading = false;
      obj.name = w.constructor.name;
      this.walletList.push(obj);
    });
    this.ual = new UAL(this.chains, "tet-ual", this.wallets);
    this.vshow = true;
  },
  methods: {
    async login(w) {
      w.loading = true;
      let name = w.name;
      this.loginMessage = `Connecting to ${name} ...`;
      this.authenticator = this.ual.authenticators.find(
        auth => auth.constructor.name == name
      );
      try {
        await this.authenticator.init();
        const users = await this.authenticator.login();
        const accountName = await users[0].getAccountName();
        w.loading = false;
        users[0].accountName = accountName;
        this.$emit("cb", users[0], this.ual);
        this.$emit("close");
      } catch (err) {
        w.loading = false;
        let m = "Service unavailable";
        if (this.authenticator) {
          m = this.authenticator.getError() || err;
          m += `</br> <a target="_blank" href=${this.authenticator.getOnboardingLink()}>${
            this.authenticator.constructor.name
          } Website</a>`;
        }
        this.loginMessage = m;
      }
    },
    async logout() {
      this.$emit("cb", null);
      await this.authenticator.logout();
    }
  }
};
</script>
<style lang="css" scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.5s;}
.fade-enter, .fade-leave-to { opacity: 0; }

#ual-modal {
  position: fixed; 
  z-index: 10; 
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  overflow: auto;
  background-color: rgb(0, 0, 0); 
  background-color: rgba(0, 0, 0, 0.4); 
}


#ual-modal-selection-content{
  font-family: "Source Sans Pro", sans-serif;
  background-color: #fefefe;
  margin: 10% auto;
  padding: 30px;
  border: 1px solid #888;
  border-radius: 6px;
  width: 370px;
}

@media only screen and (max-width: 480px) {
  #ual-modal {
    box-shadow: none;
    margin: 0;
    border-radius: 0px;
    overflow: none;
  }

  #ual-modal-selection-content {
    width: calc(100% - 30px);
    border: 0px;
    border-radius: 0px;
    padding: 15px;
    height: calc(100% - 30px);
    margin: 0px;
  }
}

/* The Close Button */
.ual-modal-close {
  color: #aaa;
  float: right;
  font-size: 2em;
  line-height: 0.5em;
  font-weight: bold;
}

.ual-modal-close:hover,
.ual-modal-close:focus {
  color: black;
  text-decoration: none;
  cursor: pointer;
}

.ual-auth-button {
  cursor: pointer;
  color: #ffffff;
  font-size: 1.25em;
  border-radius: 6px;
  margin: 0.7em auto;
  box-shadow: 0px 0px 5px rgba(0, 0, 0, 0.1);
  opacity: "1";
  width: 300px;
}
.ual-auth-icon {
  max-height: 30px;
  max-width: 100%;
  margin: auto;
  margin-top: 7%;
  display: block;
}
.ual-auth-icon-wrapper {
  height: 100%;
  float: left;
  width: 50px;
  padding: 4px 10px 9px 10px;
  background-color: rgba(0, 0, 0, 0.15);
  border-radius: 5px 0px 0px 5px;
}
.ual-auth-text {
  display: inline-block;
  padding: 12px 13px 12px 15px;
  font-size: 1.25rem;
  font-weight: bold;
  letter-spacing: 1.1px;
}
.spinner {
  width: 25px;
  height: 25px;
  margin-top:6px;
  margin-bottom:-6px;
  /* margin: 100px auto; */
  background-color: white;
  display: inline-block;

  border-radius: 100%;  
  -webkit-animation: sk-scaleout 1.0s infinite ease-in-out;
  animation: sk-scaleout 1.0s infinite ease-in-out;
}

@-webkit-keyframes sk-scaleout {
  0% { -webkit-transform: scale(0) }
  100% {
    -webkit-transform: scale(1.0);
    opacity: 0;
  }
}

@keyframes sk-scaleout {
  0% { 
    -webkit-transform: scale(0);
    transform: scale(0);
  } 100% {
    -webkit-transform: scale(1.0);
    transform: scale(1.0);
    opacity: 0;
  }
} 
</style>
