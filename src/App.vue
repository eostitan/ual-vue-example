<template>
  <div id="app">
    <div class="card">
      <div class="title">Account
        <div class="current" >
          <span v-if="user">{{user.accountName}}</span>
        </div>
      </div>
      <!-- Buttons to login/logout -->
      <button class="button" v-if="!user" @click="show=true">Login</button>
      <button class="button" v-else @click="logout" style="background-color:#d84c4c;">Logout</button>
      <!-- UAL Login Modal -->
      <vueUAL 
        ref="ual"
        :appName="appName"
        :chains="chains"
        :wallets="wallets"
        v-show="show" 
        @close="show=false" 
        @cb="loginCallback"
      />
    </div>
    <!-- show stake div if logged in -->
    <transition-group name="fade">
      <div  v-if="userInfo" class="card" key="stakingCard">
        <div class="title">Stake
          <div class="current" style="font-family:monospace;font-size:12px;margin-top:-3px;">
            <div v-if="stake">CPU {{stake.cpu}}</div>
            <div v-if="stake">NET {{stake.net}}</div>
          </div>
        </div>
        <button class="button" size="small" @click="addStake">Stake 0.0002 EOS</button>
        <p style="font-style:italic;padding:15px" v-html="message"></p>
      </div>
    </transition-group>
    
  </div>
</template>

<script>
import vueUAL from './components/login.vue';
import { Scatter } from 'ual-scatter';
import { Ledger } from 'ual-ledger';
import { Lynx } from 'ual-lynx';
import { TokenPocket } from 'ual-token-pocket';

const appName = 'test-ual-vue'
const api = "https://eos.greymass.com/v1/chain/";
const chains = [{
  chainId: 'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906',
  rpcEndpoints: [{
    protocol: 'https',
    host: 'eos.greymass.com',
    port: '443',
  }]
}];

export default {
  name: 'app',
  components: {vueUAL},
  data(){
    return{
      appName,
      chains,
      user:null,
      authenticator:null,
      wallets:[
        new Scatter(chains, {appName: appName}),
        new Ledger(chains),
        new Lynx(chains),
        new TokenPocket(chains),
      ],
      message:'',
      userInfo:null,
      show: false,
    }
  },
  methods:{
    logout(){ 
      this.message = '';
      this.$refs.ual.logout(); 
    },
    async post(url, ep, params){
      return fetch(`${url}${ep}`,{ method: 'post',body: JSON.stringify(params)}).then( resp=> resp.json());
    },
    loginCallback(user){
      this.user = user;
      this.updateAccount();
    },
    async updateAccount(){
      if (this.user) {
        const res = await this.post(api, "get_account", {account_name: this.user.accountName})
        this.userInfo = res;
      }
      else this.userInfo = null;
    },
    async sign(actions, cb, broadcast=true){
      try{
        const tx = await this.user.signTransaction({actions:actions}, {broadcast:broadcast});
        if (cb && typeof cb === 'function') cb(tx);
      }catch(ex){ if (cb && typeof cb === 'function') cb(ex);}
    },
    async addStake(){
      const actions = [{
        account: "eosio",
        name: "delegatebw",
        authorization: [{ actor: this.userInfo.account_name, permission: "active"}],
        data: {
          receiver: this.userInfo.account_name,
          from:  this.userInfo.account_name,
          stake_net_quantity:"0.0001 EOS",
          stake_cpu_quantity:"0.0001 EOS",
          transfer: false
        },
      }];
      this.message = "Waiting for user to sign transaction"
      this.sign(actions, res=>{
        if (res.transactionId){
          this.message = `Thank you for testing UAL <a target="_blank" href="https://eosq.app/tx/${res.transactionId}/"><button class="button small" >View Transaction</button></a>`
          
         this.updateAccount();
        }
        else this.message = res.message||res;
      });
    },
  },
  computed:{
    stake(){
      if (!this.userInfo) return null;
      return {cpu:this.userInfo.total_resources.cpu_weight,net:this.userInfo.total_resources.net_weight}
    }
  },
}
</script>

<style>
p, div{color:white;margin-bottom:0px;margin-top:0px;}
html{background-color:#1a1e35;}
.card{
  background-color:#212238;
  max-width:400px;
  margin:30px auto;
}
.card .title{
  width:100%;
  text-align: left;
  padding:10px 0px;
  text-indent: 10px;
  background-color:#050a28;
  margin-bottom:10px;
}
#ual-modal-selection-content{background-color: #212238 !important}
.card .current{
  float: right;
  margin-right: 10px;
  color: #a8a8ad;
}
.card .current div{ color: #a8a8ad;}
.button{
  border: none;
  color: white;
  padding: 8px 14px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 16px;
  margin:10px 0;
  background-color: #53a556;
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
