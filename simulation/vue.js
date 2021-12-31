class Vue{
	constructor(options){
		//1. 将data绑定到实例的属性上
		this.$data=options.data

		this.el = document.querySelector(options.el)

		//2.为了实现双向绑定，则需要监听到每个属性的变化，因此这里需要对每个属性进行劫持
		this.observe(this.$data)
		//3.属性代理，可以方便外部，例如通过vm.name获取vm.$data.name的值
		this.proxy(this.$data)
		//4. 解析
		this.compile(this.el,this.$data)

	}

	compile(el,data){
		let fragment = document.createDocumentFragment()
		console.log(el)
		let childEl;
		while(childEl = el.firstChild)
		{
			fragment.appendChild(childEl)
		}

		replace(fragment,data)

		function replace(obj,vm) {
			let regMatch = /\{\{\s*(\S+)\s*\}\}/
			obj.childNodes.forEach((ch)=>{
				if(ch.nodeType == 3)
				{
					let arr = regMatch.exec(ch.textContent)
					if(arr)
					{
						const orginText = ch.textContent

						let val = arr[1].split(".").reduce((newObj,key)=>newObj[key],vm)
						ch.textContent = ch.textContent.replace(regMatch,val)
						let watch = new Sub(vm,arr[1],(newValue)=>{
							ch.textContent = orginText.replace(regMatch,newValue)
						})
						dep.addItem(watch)
					}
				}else if(ch.tagName=='INPUT'){
					
					let attr = Array.from(ch.attributes).find((item)=>item.name === 'v-model')
					
					if(attr){
						let key = attr.value
						let val = key.split(".").reduce((newObj,key)=>newObj[key],vm)
						ch.value = val

						let watch = new Sub(vm,key,(newValue)=>{
							ch.value = newValue
						})
						dep.addItem(watch)

						ch.addEventListener("input",function(){
							let pNode = key.split(".").slice(0,-1).reduce((newObj,k)=>newObj[k],vm)
							console.log(key.split(".").slice(-1))
							pNode[key.split(".").slice(-1)] = this.value
						})
					}

				}else{
					replace(ch,vm)
				}
			})
		}


		el.appendChild(fragment)
	}




	observe(obj) {
	    let _self = this
	    //递归的结束条件
	    if (!obj || typeof(obj) != 'object') return 
		//遍历每个属性
		Object.keys(obj).forEach((key) =>{
		//进行劫持
	        let value = obj[key] 
	        Object.defineProperty(obj, key, {
	            enumerable: true,
	            configurable: true,
	            get() {
	                return value
	            },
	            set(newVal) {
	                value = newVal 
	                //解决vm.$data={}这种替换掉对象，劫持新对象属性
	                _self.observe(value)	              
	                dep.notify()
	            }
	        }) 
			//递归
			this.observe(value)
	    })
	}

	proxy(obj) {
	    Object.keys(obj).forEach((key) =>{
	    	//将$data下的每个属性，绑定到Vue上。
	        Object.defineProperty(this, key, {
	            enumerable: true,
	            configurable: true,
	            //实际的存取都是对$data操作。
	            get() {
	                return obj[key]
	            },
	            set(newVal) {
	                obj[key] = newVal
	            }
	        })
	    })
	}
}


class Dep{
	sub=[]

	constructor(){

	}

	addItem(obj){
		this.sub.push(obj)
	}

	notify()
	{
		this.sub.forEach((n)=>{
			n.update()
		})
	}
}

class Sub{
	constructor(vm,key,cb){
		this.data = vm
		this.key=key
		this.cb=cb;
	}

	update(){
		let value = this.key.split(".").reduce((newObj,k)=>{return newObj[k]},vm)
		this.cb(value)
	}
}

const dep = new Dep()
