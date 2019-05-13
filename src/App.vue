<template>
  <div id="app">
    <!-- Buttons to login/logout -->
    <button class="button" v-if="!user" @click="show=true">Login</button>
    <button class="button" v-else @click="logout" style="background-color:red;">Logout {{user.accountName}}</button>
    <!-- UAL Login Modal -->
    <vueUAL 
      ref="ual"
      appName= "test-ual-vue"
      :chains="chains"
      :wallets="wallets"
      v-show="show" 
      @close="show=false" 
      @cb="loginCallback"
    />
    <!-- show voting info/button if logged in -->
    <transition name="fade">
      <div v-if="userInfo" style="margin-top:20px;" >
        <div>
          <div v-if="voting">
            <div v-if="userInfo.voter_info.proxy.length>0" style="color:grey;">You are currently voting for proxy: {{userInfo.voter_info.proxy}}</div>
            <div v-else style="color:grey;">You are currently voting for {{userInfo.voter_info.producers.length}} producers</div>
            <button v-if="notVoted" class="button" size="small" @click="vote">Refresh your vote</button>
          </div>
          <div v-if="!voting">
            <p style="color:grey;">You have never voted with this account, please vote for EOS Titan Proxy</p>
            <button class="button" size="small" @click="vote">Vote EOS Titan</button>
          </div>
        </div>
        <p v-html="message"></p>
       </div>
    </transition>
    
  </div>
</template>

<script>
import vueUAL from './components/login.vue';
import { Scatter } from 'ual-scatter';
import axios from 'axios';
import { Ledger } from 'ual-ledger';
import { Lynx } from 'ual-lynx';
import { TokenPocket } from 'ual-token-pocket';
const appName = 'test-ual'
const chains = [{
    chainId: 'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906',
    rpcEndpoints: [{
        protocol: 'https',
        host: 'api.eostitan.com',
        port: '443',
    }]
}];
const api = "https://api.eostitan.com/v1/chain/";
export default {
  name: 'app',
  components: {vueUAL},
  data(){
    return{
      test:"",
      chains:chains,
      user:null,
      authenticator:null,
      wallets:[
        new Scatter(chains, {appName: appName}),
        new Ledger(chains),
        new Lynx(chains),
        new TokenPocket(chains),
      ],
      notVoted:true,
      message:'',
      userInfo:null,
      show: false,
    }
  },
  methods:{
    logout(){ 
      this.notVoted = true;
      this.$refs.ual.logout(); 
    },
    loginCallback(user){
      this.user = user;
      this.updateAccount();
    },
    async updateAccount(){
      if (this.user) {
        const res = await axios.post(api + "get_account", {account_name: this.user.accountName});
        this.userInfo = res.data;
      }
      else this.userInfo = null;
    },
    async sign(actions, cb, broadcast=true){
      this.message = "Waiting for user to sign transaction"
      try{
        const tx = await this.user.signTransaction({actions:actions}, {broadcast:broadcast});
        if (cb && typeof cb === 'function') cb(tx);
      }catch(ex){ if (cb && typeof cb === 'function') cb(ex);}
    },
    async vote(){
      let data;
      if (this.voting)
        data = {voter: this.userInfo.account_name, proxy:this.userInfo.voter_info.proxy, producers:this.userInfo.voter_info.producers};
      else data = {voter: this.userInfo.account_name, proxy:'eostitanvote', producers:[]};
      const actions = [{
        account: "eosio",
        name: "voteproducer",
        authorization: [{ actor: this.userInfo.account_name, permission: "active"}],
        data: data,
      }];
      this.sign(actions, res=>{
        if (res.transactionId){
          this.message = `Thank you for testing UAL <a target="_blank" href="https://eosq.app/tx/${res.transactionId}/"><button class="button small" >View Transaction</button></a>`
          this.updateAccount();
          this.notVoted = false;
        }
        else this.message = res.message||res;
      });
    },
  },
  computed:{
    voting(){
      if (this.userInfo && this.userInfo.voter_info && (this.userInfo.voter_info.proxy.length>0 || this.userInfo.voter_info.producers.length>0 ))
        return true;
      else return false;
    }
  },
}
</script>

<style>
.button{
  border: none;
  color: white;
  padding: 15px 32px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 16px;
  margin:15px;
  background-color: #4CAF50;
  cursor:pointer;
}
.button a{
  color: white;
  text-decoration: none;
}
.button.small{
  padding: 6px 12px;
  font-size: 12px;
  margin:6px;
}
#app {
  font-family: "Source Sans Pro", sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
.fade-enter-active, .fade-leave-active {transition: opacity .5s;}
.fade-enter, .fade-leave-to  {opacity: 0;}
</style>
