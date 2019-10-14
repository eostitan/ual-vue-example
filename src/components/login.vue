<template>
  <transition name="fade">
    <div id="ual-modal">
      <div id="ual-modal-selection-content" v-if="!showAccounts">
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
      <div id="ual-modal-selection-content" v-else>
        <span @click="showAccounts=false" class="ual-modal-close">×</span>
        <h3>
          <span>Wallet Accounts</span>
          <span @click="addIndex=true" v-if="!addIndex" style="margin-left:10px;padding:5px 6px;background-color:rgb(103, 126, 146);font-size:14px;" >+ Index</span>
          <span v-else style="margin-left:10px;" >
            <input placeholder="5,7" v-model="indexInput" type="text" style="font-size:14px;width:40px;height:19px;padding-left:3px;"> 
            <span @click="addIndices" class="accountButton">+</span>
            <span @click="addIndex=false" class="accountButton" style="margin-left:5px;" >
              <svg role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="9px"><path fill="currentColor" d="M255.545 8c-66.269.119-126.438 26.233-170.86 68.685L48.971 40.971C33.851 25.851 8 36.559 8 57.941V192c0 13.255 10.745 24 24 24h134.059c21.382 0 32.09-25.851 16.971-40.971l-41.75-41.75c30.864-28.899 70.801-44.907 113.23-45.273 92.398-.798 170.283 73.977 169.484 169.442C423.236 348.009 349.816 424 256 424c-41.127 0-79.997-14.678-110.63-41.556-4.743-4.161-11.906-3.908-16.368.553L89.34 422.659c-4.872 4.872-4.631 12.815.482 17.433C133.798 479.813 192.074 504 256 504c136.966 0 247.999-111.033 248-247.998C504.001 119.193 392.354 7.755 255.545 8z" class=""></path></svg>
            </span>
          </span>
          </h3>
        <div  v-for="key in keys" :key="key.key" v-show="key.accounts && key.accounts.length">
          <p style="font-size:11px;">{{key.key}} [{{key.index}}]</p>
          <hr>
          <div
            @click="accountName = account; finishLogin(key.index);"
            v-for="account in key.accounts"
            :key="account"
            class="ual-auth-button"
            :style="'background-color:'+ ledgerStyle.background"
            >
            <div class="ual-auth-icon-wrapper"><img class="ual-auth-icon" :src="ledgerStyle.icon"></div>
            <div class="ual-auth-text" :style="'text-align:left;width:180px;color:' + ledgerStyle.textColor">{{account}}</div>
          </div>
        </div>
        <hr>
        <h3 @click="showFetched=!showFetched">
          Wallet Keys ({{keys.length}})
          <span style="margin-left:10px;" >({{showFetched?'collapse':'expand'}})</span>
        </h3>
        <div v-show="showFetched"><p v-for="key in keys" :key="key.key" style="font-size:10px;font-family:monospace">{{key.key}} [{{key.index}}]</p></div>
        <hr>
        <transition name="fade">
          <div style="font-style:italic;padding-top:10px;" v-if="loginMessage" v-html="loginMessage"></div>
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
      indexInput:null,
      addIndex:false,
      indexArray: [0,1],
      user:null,
      walletList: [],
      showFetched:true,
      loginMessage: "",
      ual: null,
      authenticator: null,
      keys:[],
      showAccounts:false,
      accountName:null,
    };
  },
  mounted() {
    this.wallets.forEach(w => {
      let obj = w.getStyle();
      obj.loading = false;
      obj.name = w.constructor.name;
      this.walletList.push(obj);
    });
    this.ual = new UAL(this.chains, this.appName, this.wallets);
  },
  watch:{
    keys(v){
      for (const key of v) this.getAccounts(key.key)
    }
  },
  computed:{
    ledgerStyle(){
      return this.walletList.find(w=>w.name == 'Ledger')
    }
  },
  methods: {
    async addIndices(){
      this.addIndex = false;
      if (!this.indexInput.length) return;
      try{
        if (this.indexInput.includes(',')){
          let indices = this.indexInput.split(',');
          for (var index of indices){
            let val = parseInt(index);
            if(!this.indexArray.includes(val)) this.indexArray.push(index)
          }
        }
        else this.indexArray.push(this.indexInput);
        await this.getKeys();
      }catch(ex){null}
      
      this.indexInput = "";
    },
    async getAccounts(key){
      //Using a hyperion endpoint
      try{
        let res = await fetch(`https://eos.eosn.io/v2/state/get_key_accounts?public_key=${key}`).then( resp=> resp.json())
        let keyObj = this.keys.find(k=>k.key==key);
        if (keyObj) keyObj.accounts = res.account_names;
      }catch(ex){null}
    },
    async getKeys(){
      //As fetching a key from a ledger index takes around ~1s, Vue state variable 'keys' is updated per index call for better UX.
      for (var index of this.indexArray){
        this.loginMessage = `Fetching accounts for index: ${index} ...`;
        let keys = await this.authenticator.getAvailableKeys(0,[index]);
        for (var key of keys){
          let found = this.keys.find(k=>k.key==key);
          if (!found) this.keys.push({index,key,accounts:[]});
        }
      }
      this.loginMessage = `Waiting for user login ...`;
      
    },
    async login(w) {
      w.loading = true;
      let name = w.text;
      this.loginMessage = `Connecting to ${name} ...`;
      this.authenticator = this.ual.authenticators.find(
        auth => auth.constructor.name == name
      );
      try {
        await this.authenticator.init();

        if (w.name=='Ledger'){
          this.showAccounts = true;
          await this.getKeys()
          
          this.loginMessage = `Waiting for user login ...`;
        }
        else this.finishLogin();
      } catch (err) {
        w.loading = false;
        let m = "Wallet unavailable";
        if (this.authenticator) {
          m = this.authenticator.getError() || err;
          m += `</br> <a target="_blank" href=${this.authenticator.getOnboardingLink()}>${
            this.authenticator.constructor.name
          } Website</a>`;
        }
        this.loginMessage = m;
      }
    },
    async finishLogin(index=0){
      try{
        const users = await this.authenticator.login(this.accountName,index,0, 0);
        this.user = users[0];
        this.$emit("cb", this.user, this.ual);
        this.$emit("close");
        this.loginMessage = ``;
      }catch(error){
        this.loginMessage = `Error: ${error}`;
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
.accountButton{
  margin-left:10px;
  padding:5px 8px;
  cursor: pointer;
  background-color:rgb(103, 126, 146);
  font-size:14px;
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
