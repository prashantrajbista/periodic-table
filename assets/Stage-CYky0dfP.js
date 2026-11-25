import{c as e,i as t,r as n}from"./index-CTUPJ0MC.js";import{A as r,B as i,C as a,D as o,E as s,F as c,I as l,L as u,M as d,N as f,O as p,R as m,S as h,T as g,_,a as v,b as y,c as b,d as x,f as S,g as C,h as w,i as T,j as E,k as ee,l as D,m as te,n as ne,o as O,p as re,r as ie,s as k,t as ae,u as oe,v as A,w as se,x as ce,y as le,z as j}from"./Environment-BQWoiF2L.js";var M=e(t(),1),N={name:`CopyShader`,uniforms:{tDiffuse:{value:null},opacity:{value:1}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform float opacity;

		uniform sampler2D tDiffuse;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );
			gl_FragColor = opacity * texel;


		}`},P=class{constructor(){this.isPass=!0,this.enabled=!0,this.needsSwap=!0,this.clear=!1,this.renderToScreen=!1}setSize(){}render(){console.error(`THREE.Pass: .render() must be implemented in derived pass.`)}dispose(){}},ue=new o(-1,1,1,-1,0,1),de=new class extends k{constructor(){super(),this.setAttribute(`position`,new w([-1,3,0,-1,-1,0,3,-1,0],3)),this.setAttribute(`uv`,new w([0,2,0,0,2,0],2))}},F=class{constructor(e){this._mesh=new h(de,e)}dispose(){this._mesh.geometry.dispose()}render(e){e.render(this._mesh,ue)}get material(){return this._mesh.material}set material(e){this._mesh.material=e}},fe=class extends P{constructor(e,t=`tDiffuse`){super(),this.textureID=t,this.uniforms=null,this.material=null,e instanceof c?(this.uniforms=e.uniforms,this.material=e):e&&(this.uniforms=u.clone(e.uniforms),this.material=new c({name:e.name===void 0?`unspecified`:e.name,defines:Object.assign({},e.defines),uniforms:this.uniforms,vertexShader:e.vertexShader,fragmentShader:e.fragmentShader})),this._fsQuad=new F(this.material)}render(e,t,n){this.uniforms[this.textureID]&&(this.uniforms[this.textureID].value=n.texture),this._fsQuad.material=this.material,this.renderToScreen?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(t),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this._fsQuad.render(e))}dispose(){this.material.dispose(),this._fsQuad.dispose()}},pe=class extends P{constructor(e,t){super(),this.scene=e,this.camera=t,this.clear=!0,this.needsSwap=!1,this.inverse=!1}render(e,t,n){let r=e.getContext(),i=e.state;i.buffers.color.setMask(!1),i.buffers.depth.setMask(!1),i.buffers.color.setLocked(!0),i.buffers.depth.setLocked(!0);let a,o;this.inverse?(a=0,o=1):(a=1,o=0),i.buffers.stencil.setTest(!0),i.buffers.stencil.setOp(r.REPLACE,r.REPLACE,r.REPLACE),i.buffers.stencil.setFunc(r.ALWAYS,a,4294967295),i.buffers.stencil.setClear(o),i.buffers.stencil.setLocked(!0),e.setRenderTarget(n),this.clear&&e.clear(),e.render(this.scene,this.camera),e.setRenderTarget(t),this.clear&&e.clear(),e.render(this.scene,this.camera),i.buffers.color.setLocked(!1),i.buffers.depth.setLocked(!1),i.buffers.color.setMask(!0),i.buffers.depth.setMask(!0),i.buffers.stencil.setLocked(!1),i.buffers.stencil.setFunc(r.EQUAL,1,4294967295),i.buffers.stencil.setOp(r.KEEP,r.KEEP,r.KEEP),i.buffers.stencil.setLocked(!0)}},me=class extends P{constructor(){super(),this.needsSwap=!1}render(e){e.state.buffers.stencil.setLocked(!1),e.state.buffers.stencil.setTest(!1)}},he=class{constructor(e,t){if(this.renderer=e,this._pixelRatio=e.getPixelRatio(),t===void 0){let n=e.getSize(new m);this._width=n.width,this._height=n.height,t=new i(this._width*this._pixelRatio,this._height*this._pixelRatio,{type:C}),t.texture.name=`EffectComposer.rt1`}else this._width=t.width,this._height=t.height;this.renderTarget1=t,this.renderTarget2=t.clone(),this.renderTarget2.texture.name=`EffectComposer.rt2`,this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2,this.renderToScreen=!0,this.passes=[],this.copyPass=new fe(N),this.copyPass.material.blending=0,this.timer=new l}swapBuffers(){let e=this.readBuffer;this.readBuffer=this.writeBuffer,this.writeBuffer=e}addPass(e){this.passes.push(e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}insertPass(e,t){this.passes.splice(t,0,e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}removePass(e){let t=this.passes.indexOf(e);t!==-1&&this.passes.splice(t,1)}isLastEnabledPass(e){for(let t=e+1;t<this.passes.length;t++)if(this.passes[t].enabled)return!1;return!0}render(e){this.timer.update(),e===void 0&&(e=this.timer.getDelta());let t=this.renderer.getRenderTarget(),n=!1;for(let t=0,r=this.passes.length;t<r;t++){let r=this.passes[t];if(r.enabled!==!1){if(r.renderToScreen=this.renderToScreen&&this.isLastEnabledPass(t),r.render(this.renderer,this.writeBuffer,this.readBuffer,e,n),r.needsSwap){if(n){let t=this.renderer.getContext(),n=this.renderer.state.buffers.stencil;n.setFunc(t.NOTEQUAL,1,4294967295),this.copyPass.render(this.renderer,this.writeBuffer,this.readBuffer,e),n.setFunc(t.EQUAL,1,4294967295)}this.swapBuffers()}pe!==void 0&&(r instanceof pe?n=!0:r instanceof me&&(n=!1))}}this.renderer.setRenderTarget(t)}reset(e){if(e===void 0){let t=this.renderer.getSize(new m);this._pixelRatio=this.renderer.getPixelRatio(),this._width=t.width,this._height=t.height,e=this.renderTarget1.clone(),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.renderTarget1=e,this.renderTarget2=e.clone(),this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2}setSize(e,t){this._width=e,this._height=t;let n=this._width*this._pixelRatio,r=this._height*this._pixelRatio;this.renderTarget1.setSize(n,r),this.renderTarget2.setSize(n,r);for(let e=0;e<this.passes.length;e++)this.passes[e].setSize(n,r)}setPixelRatio(e){this._pixelRatio=e,this.setSize(this._width,this._height)}dispose(){this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.copyPass.dispose()}},ge=class extends P{constructor(e,t,n=null,r=null,i=null){super(),this.scene=e,this.camera=t,this.overrideMaterial=n,this.clearColor=r,this.clearAlpha=i,this.clear=!0,this.clearDepth=!1,this.needsSwap=!1,this.isRenderPass=!0,this._oldClearColor=new D}render(e,t,n){let r=e.autoClear;e.autoClear=!1;let i,a;this.overrideMaterial!==null&&(a=this.scene.overrideMaterial,this.scene.overrideMaterial=this.overrideMaterial),this.clearColor!==null&&(e.getClearColor(this._oldClearColor),e.setClearColor(this.clearColor,e.getClearAlpha())),this.clearAlpha!==null&&(i=e.getClearAlpha(),e.setClearAlpha(this.clearAlpha)),this.clearDepth==1&&e.clearDepth(),e.setRenderTarget(this.renderToScreen?null:n),this.clear===!0&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),e.render(this.scene,this.camera),this.clearColor!==null&&e.setClearColor(this._oldClearColor),this.clearAlpha!==null&&e.setClearAlpha(i),this.overrideMaterial!==null&&(this.scene.overrideMaterial=a),e.autoClear=r}},_e={name:`LuminosityHighPassShader`,uniforms:{tDiffuse:{value:null},luminosityThreshold:{value:1},smoothWidth:{value:1},defaultColor:{value:new D(0)},defaultOpacity:{value:0}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;

			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform sampler2D tDiffuse;
		uniform vec3 defaultColor;
		uniform float defaultOpacity;
		uniform float luminosityThreshold;
		uniform float smoothWidth;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );

			float v = luminance( texel.xyz );

			vec4 outputColor = vec4( defaultColor.rgb, defaultOpacity );

			float alpha = smoothstep( luminosityThreshold, luminosityThreshold + smoothWidth, v );

			gl_FragColor = mix( outputColor, texel, alpha );

		}`},I=class e extends P{constructor(e,t=1,n,r){super(),this.strength=t,this.radius=n,this.threshold=r,this.resolution=e===void 0?new m(256,256):new m(e.x,e.y),this.clearColor=new D(0,0,0),this.needsSwap=!1,this.renderTargetsHorizontal=[],this.renderTargetsVertical=[],this.nMips=5;let o=Math.round(this.resolution.x/2),s=Math.round(this.resolution.y/2);this.renderTargetBright=new i(o,s,{type:C,depthBuffer:!1}),this.renderTargetBright.texture.name=`UnrealBloomPass.bright`,this.renderTargetBright.texture.generateMipmaps=!1;for(let e=0;e<this.nMips;e++){let t=new i(o,s,{type:C,depthBuffer:!1});t.texture.name=`UnrealBloomPass.h`+e,t.texture.generateMipmaps=!1,this.renderTargetsHorizontal.push(t);let n=new i(o,s,{type:C,depthBuffer:!1});n.texture.name=`UnrealBloomPass.v`+e,n.texture.generateMipmaps=!1,this.renderTargetsVertical.push(n),o=Math.round(o/2),s=Math.round(s/2)}let l=_e;this.highPassUniforms=u.clone(l.uniforms),this.highPassUniforms.luminosityThreshold.value=r,this.highPassUniforms.smoothWidth.value=.01,this.materialHighPassFilter=new c({uniforms:this.highPassUniforms,vertexShader:l.vertexShader,fragmentShader:l.fragmentShader}),this.separableBlurMaterials=[];let d=[6,10,14,18,22];o=Math.round(this.resolution.x/2),s=Math.round(this.resolution.y/2);for(let e=0;e<this.nMips;e++)this.separableBlurMaterials.push(this._getSeparableBlurMaterial(d[e])),this.separableBlurMaterials[e].uniforms.invSize.value=new m(1/o,1/s),o=Math.round(o/2),s=Math.round(s/2);this.compositeMaterial=this._getCompositeMaterial(this.nMips),this.compositeMaterial.uniforms.blurTexture1.value=this.renderTargetsVertical[0].texture,this.compositeMaterial.uniforms.blurTexture2.value=this.renderTargetsVertical[1].texture,this.compositeMaterial.uniforms.blurTexture3.value=this.renderTargetsVertical[2].texture,this.compositeMaterial.uniforms.blurTexture4.value=this.renderTargetsVertical[3].texture,this.compositeMaterial.uniforms.blurTexture5.value=this.renderTargetsVertical[4].texture,this.compositeMaterial.uniforms.bloomStrength.value=t,this.compositeMaterial.uniforms.bloomRadius.value=.1;let f=[1,.8,.6,.4,.2];this.compositeMaterial.uniforms.bloomFactors.value=f,this.bloomTintColors=[new j(1,1,1),new j(1,1,1),new j(1,1,1),new j(1,1,1),new j(1,1,1)],this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,this.copyUniforms=u.clone(N.uniforms),this.blendMaterial=new c({uniforms:this.copyUniforms,vertexShader:N.vertexShader,fragmentShader:N.fragmentShader,premultipliedAlpha:!0,blending:2,depthTest:!1,depthWrite:!1,transparent:!0}),this._oldClearColor=new D,this._oldClearAlpha=1,this._basic=new a,this._fsQuad=new F(null)}dispose(){for(let e=0;e<this.renderTargetsHorizontal.length;e++)this.renderTargetsHorizontal[e].dispose();for(let e=0;e<this.renderTargetsVertical.length;e++)this.renderTargetsVertical[e].dispose();this.renderTargetBright.dispose();for(let e=0;e<this.separableBlurMaterials.length;e++)this.separableBlurMaterials[e].dispose();this.compositeMaterial.dispose(),this.blendMaterial.dispose(),this._basic.dispose(),this._fsQuad.dispose()}setSize(e,t){let n=Math.round(e/2),r=Math.round(t/2);this.renderTargetBright.setSize(n,r);for(let e=0;e<this.nMips;e++)this.renderTargetsHorizontal[e].setSize(n,r),this.renderTargetsVertical[e].setSize(n,r),this.separableBlurMaterials[e].uniforms.invSize.value=new m(1/n,1/r),n=Math.round(n/2),r=Math.round(r/2)}render(t,n,r,i,a){t.getClearColor(this._oldClearColor),this._oldClearAlpha=t.getClearAlpha();let o=t.autoClear;t.autoClear=!1,t.setClearColor(this.clearColor,0),a&&t.state.buffers.stencil.setTest(!1),this.renderToScreen&&(this._fsQuad.material=this._basic,this._basic.map=r.texture,t.setRenderTarget(null),t.clear(),this._fsQuad.render(t)),this.highPassUniforms.tDiffuse.value=r.texture,this.highPassUniforms.luminosityThreshold.value=this.threshold,this._fsQuad.material=this.materialHighPassFilter,t.setRenderTarget(this.renderTargetBright),t.clear(),this._fsQuad.render(t);let s=this.renderTargetBright;for(let n=0;n<this.nMips;n++)this._fsQuad.material=this.separableBlurMaterials[n],this.separableBlurMaterials[n].uniforms.colorTexture.value=s.texture,this.separableBlurMaterials[n].uniforms.direction.value=e.BlurDirectionX,t.setRenderTarget(this.renderTargetsHorizontal[n]),t.clear(),this._fsQuad.render(t),this.separableBlurMaterials[n].uniforms.colorTexture.value=this.renderTargetsHorizontal[n].texture,this.separableBlurMaterials[n].uniforms.direction.value=e.BlurDirectionY,t.setRenderTarget(this.renderTargetsVertical[n]),t.clear(),this._fsQuad.render(t),s=this.renderTargetsVertical[n];this._fsQuad.material=this.compositeMaterial,this.compositeMaterial.uniforms.bloomStrength.value=this.strength,this.compositeMaterial.uniforms.bloomRadius.value=this.radius,this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,t.setRenderTarget(this.renderTargetsHorizontal[0]),t.clear(),this._fsQuad.render(t),this._fsQuad.material=this.blendMaterial,this.copyUniforms.tDiffuse.value=this.renderTargetsHorizontal[0].texture,a&&t.state.buffers.stencil.setTest(!0),this.renderToScreen?(t.setRenderTarget(null),this._fsQuad.render(t)):(t.setRenderTarget(r),this._fsQuad.render(t)),t.setClearColor(this._oldClearColor,this._oldClearAlpha),t.autoClear=o}_getSeparableBlurMaterial(e){let t=[],n=e/3;for(let r=0;r<e;r++)t.push(.39894*Math.exp(-.5*r*r/(n*n))/n);let r=[],i=[];for(let n=1;n<e;n+=2){let a=t[n],o=n+1<e?t[n+1]:0,s=a+o;r.push((n*a+(n+1)*o)/s),i.push(s)}return new c({defines:{KERNEL_PAIRS:r.length},uniforms:{colorTexture:{value:null},invSize:{value:new m(.5,.5)},direction:{value:new m(.5,.5)},centerWeight:{value:t[0]},gaussianOffsets:{value:r},gaussianWeights:{value:i}},vertexShader:`

				varying vec2 vUv;

				void main() {

					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

				}`,fragmentShader:`

				#include <common>

				varying vec2 vUv;

				uniform sampler2D colorTexture;
				uniform vec2 invSize;
				uniform vec2 direction;
				uniform float centerWeight;
				uniform float gaussianOffsets[KERNEL_PAIRS];
				uniform float gaussianWeights[KERNEL_PAIRS];

				void main() {

					vec3 diffuseSum = texture2D( colorTexture, vUv ).rgb * centerWeight;

					for ( int i = 0; i < KERNEL_PAIRS; i ++ ) {

						vec2 uvOffset = direction * invSize * gaussianOffsets[ i ];
						vec3 sample1 = texture2D( colorTexture, vUv + uvOffset ).rgb;
						vec3 sample2 = texture2D( colorTexture, vUv - uvOffset ).rgb;
						diffuseSum += ( sample1 + sample2 ) * gaussianWeights[ i ];

					}

					gl_FragColor = vec4( diffuseSum, 1.0 );

				}`})}_getCompositeMaterial(e){return new c({defines:{NUM_MIPS:e},uniforms:{blurTexture1:{value:null},blurTexture2:{value:null},blurTexture3:{value:null},blurTexture4:{value:null},blurTexture5:{value:null},bloomStrength:{value:1},bloomFactors:{value:null},bloomTintColors:{value:null},bloomRadius:{value:0}},vertexShader:`

				varying vec2 vUv;

				void main() {

					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

				}`,fragmentShader:`

				varying vec2 vUv;

				uniform sampler2D blurTexture1;
				uniform sampler2D blurTexture2;
				uniform sampler2D blurTexture3;
				uniform sampler2D blurTexture4;
				uniform sampler2D blurTexture5;
				uniform float bloomStrength;
				uniform float bloomRadius;
				uniform float bloomFactors[NUM_MIPS];
				uniform vec3 bloomTintColors[NUM_MIPS];

				float lerpBloomFactor( const in float factor ) {

					float mirrorFactor = 1.2 - factor;
					return mix( factor, mirrorFactor, bloomRadius );

				}

				void main() {

					// 3.0 for backwards compatibility with previous alpha-based intensity
					vec3 bloom = 3.0 * bloomStrength * (
						lerpBloomFactor( bloomFactors[ 0 ] ) * bloomTintColors[ 0 ] * texture2D( blurTexture1, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 1 ] ) * bloomTintColors[ 1 ] * texture2D( blurTexture2, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 2 ] ) * bloomTintColors[ 2 ] * texture2D( blurTexture3, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 3 ] ) * bloomTintColors[ 3 ] * texture2D( blurTexture4, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 4 ] ) * bloomTintColors[ 4 ] * texture2D( blurTexture5, vUv ).rgb
					);

					float bloomAlpha = max( bloom.r, max( bloom.g, bloom.b ) );
					gl_FragColor = vec4( bloom, bloomAlpha );

				}`})}};I.BlurDirectionX=new m(1,0),I.BlurDirectionY=new m(0,1);var L={name:`OutputShader`,uniforms:{tDiffuse:{value:null},toneMappingExposure:{value:1}},vertexShader:`
		precision highp float;

		uniform mat4 modelViewMatrix;
		uniform mat4 projectionMatrix;

		attribute vec3 position;
		attribute vec2 uv;

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		precision highp float;

		uniform sampler2D tDiffuse;

		#include <tonemapping_pars_fragment>
		#include <colorspace_pars_fragment>

		varying vec2 vUv;

		void main() {

			gl_FragColor = texture2D( tDiffuse, vUv );

			// tone mapping

			#ifdef LINEAR_TONE_MAPPING

				gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );

			#elif defined( REINHARD_TONE_MAPPING )

				gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );

			#elif defined( CINEON_TONE_MAPPING )

				gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );

			#elif defined( ACES_FILMIC_TONE_MAPPING )

				gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );

			#elif defined( AGX_TONE_MAPPING )

				gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );

			#elif defined( NEUTRAL_TONE_MAPPING )

				gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );

			#elif defined( CUSTOM_TONE_MAPPING )

				gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );

			#endif

			// color space

			#ifdef SRGB_TRANSFER

				gl_FragColor = sRGBTransferOETF( gl_FragColor );

			#endif

		}`},ve=class extends P{constructor(){super(),this.isOutputPass=!0,this.uniforms=u.clone(L.uniforms),this.material=new r({name:L.name,uniforms:this.uniforms,vertexShader:L.vertexShader,fragmentShader:L.fragmentShader}),this._fsQuad=new F(this.material),this._outputColorSpace=null,this._toneMapping=null}render(e,t,n){this.uniforms.tDiffuse.value=n.texture,this.uniforms.toneMappingExposure.value=e.toneMappingExposure,(this._outputColorSpace!==e.outputColorSpace||this._toneMapping!==e.toneMapping)&&(this._outputColorSpace=e.outputColorSpace,this._toneMapping=e.toneMapping,this.material.defines={},oe.getTransfer(this._outputColorSpace)===`srgb`&&(this.material.defines.SRGB_TRANSFER=``),this._toneMapping===1?this.material.defines.LINEAR_TONE_MAPPING=``:this._toneMapping===2?this.material.defines.REINHARD_TONE_MAPPING=``:this._toneMapping===3?this.material.defines.CINEON_TONE_MAPPING=``:this._toneMapping===4?this.material.defines.ACES_FILMIC_TONE_MAPPING=``:this._toneMapping===6?this.material.defines.AGX_TONE_MAPPING=``:this._toneMapping===7?this.material.defines.NEUTRAL_TONE_MAPPING=``:this._toneMapping===5&&(this.material.defines.CUSTOM_TONE_MAPPING=``),this.material.needsUpdate=!0),this.renderToScreen===!0?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(t),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this._fsQuad.render(e))}dispose(){this.material.dispose(),this._fsQuad.dispose()}};function ye(e){let t=Math.min(4e4,Math.max(800,e))/100,n=e=>Math.min(255,Math.max(0,e))/255,r=t<=66?255:329.7*(t-60)**-.1332,i=t<=66?99.47*Math.log(t)-161.12:288.12*(t-60)**-.0755,a=t>=66?255:t<=19?0:138.52*Math.log(t-10)-305.04;return new D().setRGB(n(r),n(i),n(a),f)}function be(e){let t=(t,n,r)=>Math.exp(-.5*((e-t)*(e<t?n:r))**2),n=.362*t(442,.0624,.0374)+1.056*t(599.8,.0264,.0323)-.065*t(501.1,.049,.0382),r=.821*t(568.8,.0213,.0247)+.286*t(530.9,.0613,.0322),i=1.217*t(437,.0845,.0278)+.681*t(459,.0385,.0725),a=[3.2406*n-1.5372*r-.4986*i,-.9689*n+1.8758*r+.0415*i,.0557*n-.204*r+1.057*i].map(e=>Math.max(0,e));a[1]+=.17*a[0],a[2]+=.02*a[1];let o=Math.max(...a);return new D(a[0]/o,a[1]/o,a[2]/o)}function xe(e,t=1){let n=new se({color:0,roughness:.02,ior:1.47,transparent:!0,opacity:.02,side:e,depthWrite:!1,envMapIntensity:1.1*t,blending:5,blendSrc:201,blendDst:205});return n.onBeforeCompile=e=>{e.fragmentShader=e.fragmentShader.replace(`#include <dithering_fragment>`,`#include <dithering_fragment>
      float rim = 1.0 - abs(dot(normalize(vNormal), normalize(vViewPosition)));
      gl_FragColor.a = clamp(0.015 + 0.72 * pow(rim, 5.0), 0.0, 1.0);`)},n}var Se=e=>{let t=Math.sin(e)*43758.5453;return t-Math.floor(t)},R=null;function Ce(){if(R)return R;let e=new Uint8Array(110592),t=(e,t,n,r)=>{let i=e=>{let t=Math.floor(e),n=e-t;return[(t%r+r)%r,(t+1)%r,n*n*(3-2*n)]},[a,o,s]=i(e*r),[c,l,u]=i(t*r),[d,f,p]=i(n*r),m=(e,t,n)=>Se(e*12.99+t*78.23+n*37.72+r*3.1),h=(e,t,n)=>e+(t-e)*n;return h(h(h(m(a,c,d),m(o,c,d),s),h(m(a,l,d),m(o,l,d),s),u),h(h(m(a,c,f),m(o,c,f),s),h(m(a,l,f),m(o,l,f),s),u),p)};for(let n=0,r=0;n<48;n++)for(let i=0;i<48;i++)for(let a=0;a<48;a++,r++){let o=a/48,s=i/48,c=n/48;e[r]=255*(.53*t(o,s,c,4)+.3*t(o,s,c,8)+.17*t(o,s,c,16))}return R=new S(e,48,48,48),R.format=E,R.minFilter=R.magFilter=le,R.wrapS=R.wrapT=R.wrapR=d,R.needsUpdate=!0,R}function z(e=256,t=5,n=6,r=1,i=1){let a=document.createElement(`canvas`);a.width=a.height=e;let o=a.getContext(`2d`),s=o.createImageData(e,e);for(let i=0;i<e;i++)for(let a=0;a<e;a++){let o=0,c=.5,l=0;for(let r=0,s=n;r<t;r++,s*=2,c*=.5){let t=a/e*s,n=i/e*s,r=Math.floor(t),u=Math.floor(n),d=e=>e*e*(3-2*e),f=d(t-r),p=d(n-u),m=(e,t)=>Se(e%s*27.1+t%s*61.7+s);o+=c*((m(r,u)*(1-f)+m(r+1,u)*f)*(1-p)+(m(r,u+1)*(1-f)+m(r+1,u+1)*f)*p),l+=c}let u=Math.max(0,Math.min(255,((o/l-.5)*r+.5)*255));s.data.set([u,u,u,255],(i*e+a)*4)}o.putImageData(s,0,0);let c=new b(a);return c.wrapS=c.wrapT=d,c.repeat.set(i,i),c}var we=`
  uniform float uR, uY0, uY1; uniform sampler2D uDepth; uniform vec2 uRes; uniform mat4 uProjInv; uniform vec3 uFwd;
  varying vec3 vW;
  // Enter and leave distances through an upright cylinder, stopped at solid objects.
  vec2 span(vec3 o, vec3 d) {
    float a = max(dot(d.xz, d.xz), 1e-6), b = dot(o.xz, d.xz), c = dot(o.xz, o.xz) - uR * uR, h = b * b - a * c;
    if (h < 0.0) return vec2(1.0, 0.0);
    h = sqrt(h);
    float t0 = (-b - h) / a, t1 = (-b + h) / a;
    float y0 = (uY0 - o.y) / d.y, y1 = (uY1 - o.y) / d.y;
    t0 = max(max(t0, min(y0, y1)), 0.0); t1 = min(t1, max(y0, y1));
    float z = texture2D(uDepth, gl_FragCoord.xy / uRes).x;
    if (z < 1.0) {
      vec4 v = uProjInv * vec4(gl_FragCoord.xy / uRes * 2.0 - 1.0, z * 2.0 - 1.0, 1.0);
      t1 = min(t1, (-v.z / v.w) / dot(d, uFwd));
    }
    return vec2(t0, t1);
  }`,Te=`varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;function Ee(e,t,n){return{uR:{value:e},uY0:{value:t},uY1:{value:n},uDepth:{value:null},uRes:{value:new m(1,1)},uProjInv:{value:new ce},uFwd:{value:new j},uTime:{value:0},uAbsorb:{value:new j},uSmoke:{value:0},uFlame:{value:0},uFlameCol:{value:new D(1,.5,.05)},uFlamePos:{value:new j(0,.75,0)},uTall:{value:1},uOpen:{value:0},uStudio:{value:1},uNoise:{value:Ce()}}}var De=e=>new c({uniforms:e,vertexShader:Te,side:1,transparent:!0,depthWrite:!1,depthTest:!1,blending:5,blendSrc:200,blendDst:202,fragmentShader:we+`uniform vec3 uAbsorb;
  void main(){ vec3 d = normalize(vW - cameraPosition); vec2 s = span(cameraPosition, d);
    gl_FragColor = vec4(exp(-uAbsorb * max(s.y - s.x, 0.0) / uR), 1.0); }`}),Oe=e=>new c({uniforms:e,vertexShader:Te,side:1,transparent:!0,depthWrite:!1,depthTest:!1,blending:5,blendSrc:201,blendDst:205,fragmentShader:we+`
  precision highp sampler3D;
  uniform sampler3D uNoise; uniform float uTime, uSmoke, uFlame, uTall, uStudio, uOpen; uniform vec3 uFlameCol, uFlamePos;
  float n3(vec3 p){ return texture(uNoise, p).r; }
  void main(){
    if (uSmoke + uFlame < 0.003) discard;
    vec3 d = normalize(vW - cameraPosition); vec2 s = span(cameraPosition, d);
    if (s.y <= s.x) discard;
    const int N = 44;
    float dt = (s.y - s.x) / float(N);
    float jit = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
    vec3 L = vec3(0.0); float T = 1.0;
    for (int i = 0; i < N; i++) {
      vec3 p = cameraPosition + d * (s.x + (float(i) + jit) * dt);
      // swirl: gas rises on the axis and turns over near the lid
      float a = 0.35 * sin(p.y * 2.3 + uTime * 0.3); mat2 r = mat2(cos(a), -sin(a), sin(a), cos(a));
      vec3 q = p; q.xz = r * q.xz;
      float w = n3(q * 0.42 + vec3(0.0, -uTime * 0.05, 0.0));
      float f = n3(q * vec3(0.62, 0.42, 0.62) + w * 0.55 + vec3(0.03 * uTime, -0.09 * uTime, 0.0));
      float smoke = uSmoke * 2.1 * smoothstep(0.36, 0.8, f) * mix(0.55, 1.25, smoothstep(uY0, uY1, p.y));
      if (uOpen > 0.5) smoke *= (1.0 - smoothstep(0.05, 0.2 + 0.3 * p.y, length(p.xz + 0.2 * (f - 0.5)))) * (1.0 - smoothstep(0.35, 1.5, p.y));
      vec3 rel = p - uFlamePos;
      float ht = rel.y / (0.62 * uTall);
      float fl = 0.0;
      if (uFlame > 0.003 && ht > -0.12 && ht < 1.25) {
        vec3 fp = rel * vec3(1.5, 0.85, 1.5) - vec3(0.0, uTime * 1.15, 0.0);
        float wob = n3(fp * 0.75) - n3(fp * 0.75 + 0.5), wob2 = n3(fp * 0.75 + 0.27) - n3(fp * 0.75 + 0.77);
        vec2 ax = rel.xz + vec2(wob, wob2) * 0.2 * clamp(ht, 0.0, 1.0);
        float width = 0.165 * (0.55 + 0.75 * smoothstep(-0.12, 0.18, ht)) * (1.0 - smoothstep(0.15, 1.15, ht + wob * 0.5));
        float rr = length(ax) / max(width, 1e-3);
        fl = exp(-rr * rr * 1.7) * smoothstep(-0.12, 0.02, ht) * (0.6 + 0.9 * n3(fp * 1.3)) * step(1e-3, width);
      }
      float dist2 = dot(rel - vec3(0.0, 0.2, 0.0), rel - vec3(0.0, 0.2, 0.0));
      vec3 inL = vec3(0.62, 0.63, 0.65) * uStudio * (0.7 + 0.5 * smoothstep(-0.6, 0.6, -p.x)) + uFlameCol * uFlame * 0.2 / (0.1 + dist2 * 2.2);
      float st = smoke * dt;
      L += T * (inL * 0.9 * st + uFlameCol * fl * uFlame * 17.0 * dt + mix(uFlameCol, vec3(1.0), 0.22) * pow(fl, 3.0) * uFlame * 16.0 * dt * dot(uFlameCol, vec3(0.34)));
      T *= exp(-st);
      if (T < 0.02) break;
    }
    gl_FragColor = vec4(L, 1.0 - T);
  }`});function ke(e,t=1e-4){t=Math.max(t,2**-52);let n={},r=e.getIndex(),i=e.getAttribute(`position`),a=r?r.count:i.count,o=0,s=Object.keys(e.attributes),c=[],l=new Map,u=[],d=[`getX`,`getY`,`getZ`,`getW`],f=t*.5,p=10**Math.log10(1/t),m=f*p;for(let t=0;t<a;t++){let i=r?r.getX(t):t,a=``;for(let t=0,n=s.length;t<n;t++){let n=s[t],r=e.getAttribute(n),o=r.itemSize;for(let e=0;e<o;e++)a+=`${Math.trunc(r[d[e]](i)*p+m)},`}a in n?u.push(n[a]):(c.push(i),n[a]=o,u.push(o),o++)}let h=e.clone();for(let t in e.attributes)h.setAttribute(t,Ae(e.attributes[t],c,l));for(let t in e.morphAttributes)h.morphAttributes[t]=e.morphAttributes[t].map(e=>Ae(e,c,l));return h.setIndex(u),h}function Ae(e,t,n=new Map){let r=e.isInterleavedBufferAttribute,i=r?e.data:e,a=r?i.stride:e.itemSize,o=r?n.get(i):void 0;if(o===void 0){let s=new i.array.constructor(t.length*a);for(let e=0;e<t.length;e++)for(let n=0;n<a;n++)s[e*a+n]=i.array[t[e]*a+n];o=r?new i.constructor(s,a,i.meshPerAttribute):new e.constructor(s,e.itemSize,e.normalized,e.meshPerAttribute),o.setUsage(i.usage),r&&n.set(i,o)}let s=r?new e.constructor(o,e.itemSize,e.offset,e.normalized):o;return s.name=e.name,r||(s.gpuType=e.gpuType),s}var B=n(),je=e=>()=>(e=e*1664525+1013904223>>>0,e/4294967296),V=(e,t,n)=>Math.sin(e*1.7+Math.sin(t*2.3+n))*Math.sin(t*1.9+Math.sin(n*2.1+e*1.3))*Math.sin(n*1.6+Math.sin(e*2.7+t*.7));function Me(e,t){e.deleteAttribute(`uv`),e.deleteAttribute(`normal`);let n=ke(e,1e-4),r=n.attributes.position,i=new j;for(let e=0;e<r.count;e++)i.fromBufferAttribute(r,e),i.multiplyScalar(t(i)),r.setXYZ(e,i.x,i.y,i.z);return n.computeVertexNormals(),n}function H(e,t,n,r,i){let a=je(t),o=[],s=[],c=new ce,l=new te,u=new ee;for(let t=0;t<e;t++){let e=n(a).toNonIndexed(),d=i(a);l.set(a()*6.28,a()*6.28,a()*6.28),c.compose(new j(...r(a,t)),u.setFromEuler(l),new j(d,d,d)),e.applyMatrix4(c),e.computeVertexNormals(),o.push(...e.attributes.position.array),s.push(...e.attributes.normal.array),e.dispose()}let d=new k;return d.setAttribute(`position`,new w(o,3)),d.setAttribute(`normal`,new w(s,3)),d}var U=(e,t)=>n=>{let r=n()*6.283,i=Math.sqrt(n())*e,a=t*(1-i/e)**1.2;return[i*Math.cos(r),n()*a,i*Math.sin(r)]},Ne=(e,t)=>n=>{let r=n()*6.283,i=Math.sqrt(n())*e*(.97+.03*Math.sin(r*5)+.02*Math.sin(r*11)),a=t*Math.max(0,1-i/e)**.9;return[i*Math.cos(r),a*(.86+.14*n()),i*Math.sin(r)]};function Pe(e){let t=()=>z(256,5,6,1.4,1),n=e=>new se(e);switch(e){case`sodium`:return{geo:Me(new O(.3,.2,.25,40,28,34),e=>{let t=Math.hypot(e.x/.15,e.y/.1,e.z/.125);return 1/Math.max(t,.01)**.28*(1+.07*V(e.x*11,e.y*11,e.z*11)+.02*V(e.x*27,e.y*27,e.z*27))}),y:.088,mat:n({color:`#cfcbc4`,metalness:1,roughness:.38,envMapIntensity:1.3})};case`magnesium`:{let e=[],t=[];for(let n=0;n<=260;n++){let r=n/260,i=r*15,a=.07+.1*r,o=.008*Math.sin(i*5.3),s=.02+.05*r+o;if(e.push((a+o)*Math.cos(i),s,(a+o)*Math.sin(i),(a-o)*Math.cos(i),s+.05,(a-o)*Math.sin(i)),n<260){let e=n*2;t.push(e,e+1,e+2,e+1,e+3,e+2)}}let r=new k;return r.setAttribute(`position`,new w(e,3)),r.setIndex(t),r.computeVertexNormals(),{geo:r,y:.1,mat:n({color:`#a5a5a6`,metalness:1,roughness:.42,side:2})}}case`aluminium`:{let e=new _(.15,9),t=e.attributes.position,r=new j;for(let e=0;e<t.count;e++){r.fromBufferAttribute(t,e);let n=1+.2*Math.abs(V(r.x*34,r.y*34,r.z*34))-.17*Math.abs(V(r.x*61+2,r.y*61,r.z*61));r.multiplyScalar(n),t.setXYZ(e,r.x,r.y*.8,r.z)}return e.computeVertexNormals(),{geo:e,y:.11,mat:n({color:`#dcdddf`,metalness:1,roughness:.2,flatShading:!0})}}case`copper`:{let e=new O(.52,.016,.4,60,1,40),r=e.attributes.position;for(let e=0;e<r.count;e++)r.setY(e,r.getY(e)+.07*(r.getX(e)/.26)**2+.004*V(r.getX(e)*16,1,r.getZ(e)*16));return e.computeVertexNormals(),{geo:e,y:.014,mat:n({color:`#c9744a`,metalness:1,roughness:.3,roughnessMap:t()})}}case`mercury`:{let e=[];for(let t=0;t<=40;t++){let n=Math.PI/2*(1-t/40);e.push(new m(.31+.05*Math.cos(n)-(t===0?.36:0)*1,.045*Math.sin(n)+.03))}e[0]=new m(0,.078);for(let t=1;t<12;t++)e.splice(t,0,new m(.31*t/12,.078-.003*(t/12)**2));for(let t=1;t<=12;t++){let n=t/12*-(Math.PI/2.6);e.push(new m(.31+.05*Math.cos(n),.03+.035*Math.sin(n)))}return{geo:new A(e.reverse(),96),y:.002,mat:n({color:`#e6e7ea`,metalness:1,roughness:.03,side:2,envMapIntensity:1.3})}}case`bromine`:return{geo:new x(.585,.57,.16,96),y:.085,mat:n({color:`#1c0301`,roughness:.06,clearcoat:1,clearcoatRoughness:.03,ior:1.66})};case`iodine`:return{geo:H(150,5,()=>new x(1,1,.16,6),U(.3,.16),e=>.02+.04*e()),y:.02,mat:n({color:`#1d1a24`,metalness:.75,roughness:.24,flatShading:!0})};case`sulfur`:return{geo:H(170,3,()=>new s(1,0),U(.25,.22),e=>.022+.045*e()),y:.02,mat:n({color:`#d6b512`,roughness:.34,clearcoat:.35,flatShading:!0,sheen:.3})};case`iron`:return{geo:H(420,8,e=>new O(1,.25+e(),.5),U(.3,.17),e=>.012+.02*e()),y:.02,mat:n({color:`#4c4b4a`,metalness:.9,roughness:.5,flatShading:!0})};case`mix`:{let e=9500,t=H(e,8,()=>new _(1,0),Ne(.36,.2),e=>.0055+.0065*e()),r=t.attributes.position.count/e,i=new Float32Array(e*r*3),a=je(4),o=new D(`#3b3c3e`),s=new D(`#c9ad25`);for(let t=0;t<e;t++){let e=(a()<.55?o:s).clone().multiplyScalar(.75+.5*a());for(let n=0;n<r;n++)i.set([e.r,e.g,e.b],(t*r+n)*3)}t.setAttribute(`color`,new w(i,3));let c=n({color:`#ffffff`,roughness:.85,flatShading:!0,vertexColors:!0});return c.userData.front={value:-1},c.onBeforeCompile=e=>{e.uniforms.uFront=c.userData.front,e.vertexShader=e.vertexShader.replace(`#include <common>`,`#include <common>
varying vec3 vP;`).replace(`#include <begin_vertex>`,`#include <begin_vertex>
vP = position;`),e.fragmentShader=e.fragmentShader.replace(`#include <common>`,`#include <common>
varying vec3 vP; uniform float uFront;`).replace(`#include <emissivemap_fragment>`,`float d = uFront - vP.x + 0.06 * sin(vP.z * 23.0) + 0.05 * sin(vP.z * 61.0 + vP.y * 40.0); totalEmissiveRadiance *= smoothstep(0.0, 0.06, d) * (1.0 - smoothstep(0.1, 0.5, d)) * (0.35 + 2.2 * vColor.r);`)},{geo:t,y:.02,mat:c}}}}function Fe({kind:e,position:t,scale:n=1,left:r,T:i,turn:a}){let o=(0,M.useMemo)(()=>Pe(e),[e]),s=(0,M.useMemo)(()=>({c:o.mat.color.clone(),metal:o.mat.metalness,rough:o.mat.roughness}),[o]),c=(0,M.useRef)(null),l=(0,M.useRef)(r),u=(0,M.useRef)(0),d=(0,M.useRef)(0),f=(0,M.useMemo)(()=>new D(a?.color??`#000`),[a?.color]);return T((t,p)=>{let m=Math.min(p,.05);l.current=y.damp(l.current,r,.9,m),u.current=y.damp(u.current,a?.amount??0,.9,m),d.current=y.damp(d.current,Math.max(0,(i-798)/500)**1.6,1.6,m);let h=o.mat;h.color.copy(s.c).lerp(f,u.current),h.metalness=s.metal*(1-(a?.matte||e===`mix`?u.current:0)),h.roughness=s.rough+(.8-s.rough)*(a?.matte?u.current:0),h.emissive.copy(ye(Math.max(900,i))),h.emissiveIntensity=d.current*(e===`mix`?2.4:.7);let g=h.userData.front;if(g&&(g.value=i>1e3?Math.min(1.2,g.value<-.5?-.45:g.value+m*.2):-1),c.current){c.current.visible=l.current>.015;let t=Math.cbrt(Math.max(l.current,1e-4))*n;e===`bromine`?c.current.scale.set(1,Math.max(.02,l.current),1):c.current.scale.setScalar(t)}}),(0,B.jsx)(`group`,{position:t,children:(0,B.jsx)(`mesh`,{ref:c,geometry:o.geo,material:o.mat,position:[0,o.y*n,0],castShadow:!0,receiveShadow:!0})})}var W=.62,G=2.05,K=1,Ie={Cl:[.12,.11,.55],Br:[.32,1.25,2.3],I:[.5,1,.24]},q={Na:`sodium`,Mg:`magnesium`,Al:`aluminium`,S:`sulfur`,Fe:`iron`,Cu:`copper`,Hg:`mercury`,Br:`bromine`,I:`iodine`},J=y.damp;function Le({u:e}){let{gl:t,scene:n,camera:r,size:o,viewport:s}=v(),c=s.dpr,l=(0,M.useMemo)(()=>{let e=new i(4,4);return e.depthTexture=new re(4,4),e},[]),u=(0,M.useMemo)(()=>new a({colorWrite:!1}),[]),d=(0,M.useMemo)(()=>{let e=new he(t,new i(4,4,{type:C,samples:4}));return e.addPass(new ge(n,r)),e.addPass(new I(new m(4,4),.3,.5,1.7)),e.addPass(new ve),e},[t,n,r]);return(0,M.useEffect)(()=>{d.setPixelRatio(c),d.setSize(o.width,o.height),l.setSize(Math.round(o.width*c),Math.round(o.height*c)),e.uRes.value.set(Math.round(o.width*c),Math.round(o.height*c)),e.uDepth.value=l.depthTexture},[d,l,o,c,e]),(0,M.useEffect)(()=>()=>{d.dispose(),l.dispose(),u.dispose()},[d,l,u]),T(()=>{let i=n.background;n.overrideMaterial=u,n.background=null,r.layers.set(0),t.shadowMap.autoUpdate=!1,t.setRenderTarget(l),t.clear(),t.render(n,r),t.setRenderTarget(null),n.overrideMaterial=null,n.background=i,r.layers.enable(K),t.shadowMap.autoUpdate=!0,e.uProjInv.value.copy(r.projectionMatrixInverse),r.getWorldDirection(e.uFwd.value),d.render()},1),null}var Re=e=>e.map(e=>new m(e[0],e[1])),Y=(e,t,n,r=16)=>Array.from({length:r},(i,a)=>[e,t+(n-t)*(a+1)/(r+1)]);function X({pts:e,children:t,seg:n=128,...r}){let i=(0,M.useMemo)(()=>new A(Re(e),n),[e,n]);return(0,B.jsx)(`mesh`,{geometry:i,...r,children:t})}function Z({pts:e}){let t=(0,M.useMemo)(()=>new A(Re(e),160),[e]),[n,r]=(0,M.useMemo)(()=>[xe(1,.3),xe(0,.6)],[]);return(0,B.jsxs)(B.Fragment,{children:[(0,B.jsx)(`mesh`,{geometry:t,material:n,renderOrder:1,layers:K}),(0,B.jsx)(`mesh`,{geometry:t,material:r,renderOrder:6,layers:K})]})}function ze(){return(0,B.jsxs)(B.Fragment,{children:[(0,B.jsx)(X,{pts:Ve,layers:K,renderOrder:1,children:(0,B.jsx)(`meshPhysicalMaterial`,{transmission:1,roughness:.02,ior:1.47,thickness:.12,attenuationColor:`#cfe0d8`,attenuationDistance:.9})}),(0,B.jsx)(X,{pts:Be,layers:K,renderOrder:1,children:(0,B.jsx)(`meshPhysicalMaterial`,{color:`#20262a`,roughness:.03,transparent:!0,opacity:.55,depthWrite:!1,side:2})})]})}var Be=[[.55,.004],[.59,.01],[.612,.03],[.616,.05]],Ve=[[0,.002],[.52,.002],[.58,.008],[.606,.026],[.617,.058],[.584,.064],[.544,.053],[0,.051]],He=[[0,0],[.52,0],[.58,.006],[.608,.025],[W,.06],...Y(W,.06,1.9499999999999997),[W,1.9499999999999997],[.67,1.9749999999999999],[.72,1.9899999999999998],[.74,2.03],[.73,G],[.604,G]],Ue=[[.604,G],...Y(.604,G,.1),[.604,.1],[.584,.066],[.544,.052],[0,.05]],We=[[.05,2.054],[.755,2.054],[.765,2.0639999999999996],[.765,2.098],[.755,2.1079999999999997],[.05,2.1079999999999997]],Ge=[[0,.62],[.1,.625],[.17,.66],[.205,.73],[.215,.8],[.205,.803],[.19,.735],[.155,.675],[.09,.645],[0,.64]],Ke=[[0,0],[.6,0],[.63,.012],[.64,.04],...Y(.64,.04,1.26,6),[.64,1.26],[.66,1.3],[.86,1.3],[.88,1.32],[.88,1.46],[.86,1.48],[0,1.48]],qe=[[0,1.485],[.86,1.485],[.88,1.505],[.88,1.65],[.85,1.68],[.62,1.7],[.52,1.75],[.36,1.81],[.2,1.85],[0,1.87]],Je=[[0,0],[.4,0],[.45,.014],[.62,.14],[.65,.165],[.645,.18],[.62,.172],[.585,.15],[.44,.052],[0,.045]];function Q(){return(0,M.useMemo)(()=>{let e=z(256,5,8,1.2,2),t=z(256,3,48,.3,1),n=z(512,6,9,1.5,1);return t.repeat.set(1,40),{rough:e,brushed:t,film:n}},[])}function Ye({dim:e}){let t=(0,M.useRef)(null),n=(0,M.useRef)(null),r=(0,M.useRef)(null),i=Q(),{scene:a}=v(),o=(0,M.useMemo)(()=>{let e=[[12,0],[0,0],[-3.5,0],...Array.from({length:24},(e,t)=>{let n=(t+1)/24*(Math.PI/2);return[-3.5-5*Math.sin(n),5-5*Math.cos(n)]}),[-8.5,16]],t=new p(50,1,1,e.length-1),n=t.attributes.position;for(let t=0;t<n.count;t++){let[r,i]=e[Math.floor(t/2)];n.setXYZ(t,n.getX(t),i,r)}return t.computeVertexNormals(),t},[]);return T(()=>{let i=1-e.current*.74;a.environmentIntensity=.75*i,t.current&&(t.current.intensity=72*i),n.current&&(n.current.intensity=1.5*i),r.current&&(r.current.intensity=70*i)}),(0,B.jsxs)(B.Fragment,{children:[(0,B.jsx)(ae,{files:`./hdri/studio_small_09_1k.hdr`}),(0,B.jsx)(`spotLight`,{ref:t,position:[-3.4,4.2,2.2],angle:.5,penumbra:.9,castShadow:!0,"shadow-mapSize":[2048,2048],"shadow-bias":-2e-4,"shadow-normalBias":.02,"shadow-radius":9,color:`#fff8ee`}),(0,B.jsx)(`spotLight`,{ref:r,position:[2.5,5.5,-3],angle:.9,penumbra:1,"target-position":[0,2,-9],color:`#eef4ff`}),(0,B.jsx)(`rectAreaLight`,{ref:n,position:[3.4,2.6,2],width:1,height:3,rotation:[0,1.05,0]}),(0,B.jsx)(`mesh`,{geometry:o,position:[0,-.103,0],receiveShadow:!0,children:(0,B.jsx)(`meshStandardMaterial`,{color:`#8b8f93`,roughness:.6,roughnessMap:i.rough,envMapIntensity:.55,side:2})}),(0,B.jsxs)(`mesh`,{position:[0,-.052,0],receiveShadow:!0,castShadow:!0,children:[(0,B.jsx)(`boxGeometry`,{args:[2.1,.1,2.1]}),(0,B.jsx)(`meshStandardMaterial`,{color:`#c4c3c0`,roughness:.34})]})]})}function Xe({amount:e,color:t,radius:n,y:r,film:i}){let a=Q(),o=(0,M.useRef)(null),s=(0,M.useRef)(null),c=(0,M.useMemo)(()=>{let e=[0,1,0],t=[];for(let t=1;t<=40;t++)for(let r=0;r<128;r++){let i=2*Math.PI*r/128,a=n*t/40,o=.55+.3*Math.min(1,t/14)*Math.sin(7*a+2*Math.cos(2*i))*Math.cos(3*i+5*a)+.16*Math.min(1,t/14)*Math.sin(r*12.9898+t*78.233)*Math.sin(t*3.7+r*1.3);e.push(a*Math.cos(i),o*(1-.6*(t/40)**6),a*Math.sin(i))}for(let e=0;e<128;e++)t.push(0,1+(e+1)%128,1+e);for(let e=0;e<39;e++)for(let n=0;n<128;n++){let r=1+e*128,i=(n+1)%128;t.push(r+n,r+i,r+128+n,r+i,r+128+i,r+128+n)}let r=new k;return r.setAttribute(`position`,new w(e,3)),r.setIndex(t),r.computeVertexNormals(),r},[n]);return T(()=>{let t=e.current;o.current&&(o.current.visible=t>.02,o.current.scale.y=Math.max(.001,.07*t)),s.current&&(s.current.opacity=i*t)}),(0,B.jsxs)(B.Fragment,{children:[(0,B.jsx)(`mesh`,{ref:o,geometry:c,position:[0,r,0],receiveShadow:!0,children:(0,B.jsx)(`meshStandardMaterial`,{color:t,roughness:.95})}),i>0&&(0,B.jsxs)(`mesh`,{position:[0,1.045,0],renderOrder:5,layers:K,children:[(0,B.jsx)(`cylinderGeometry`,{args:[.6,.6,1.9299999999999997,128,1,!0]}),(0,B.jsx)(`meshStandardMaterial`,{ref:s,color:t,roughness:1,transparent:!0,alphaMap:a.film,side:2,depthWrite:!1,opacity:0})]})]})}function Ze({amount:e}){let t=(0,M.useRef)(null),n=(0,M.useMemo)(()=>xe(0,1.6),[]),r=(0,M.useMemo)(()=>Array.from({length:320},(e,t)=>{let n=e=>{let n=Math.sin(t*91.7+e*47.3)*43758.5;return n-Math.floor(n)};return{a:n(1)*6.283,y:.15+n(2)*1.6999999999999997,s:.007+.022*n(3)**3,t:n(4)}}),[]),i=(0,M.useMemo)(()=>new g,[]);return T(()=>{let n=t.current;n&&(r.forEach((t,r)=>{let a=y.smoothstep(e.current*1.6-t.t*.6,0,1);i.position.set(.6*Math.cos(t.a),t.y,.6*Math.sin(t.a)),i.scale.set(t.s*a+1e-5,t.s*1.25*a+1e-5,t.s*a+1e-5),i.updateMatrix(),n.setMatrixAt(r,i.matrix)}),n.instanceMatrix.needsUpdate=!0)}),(0,B.jsx)(`instancedMesh`,{ref:t,args:[void 0,void 0,320],material:n,renderOrder:5,layers:K,frustumCulled:!1,children:(0,B.jsx)(`sphereGeometry`,{args:[1,14,10]})})}function $(e){return(0,B.jsx)(`meshStandardMaterial`,{color:`#b4b6b8`,metalness:1,roughness:e.brushed?.85:.34,roughnessMap:e.brushed})}function Qe({P:e}){let t=Q(),n=(0,M.useRef)(null),r=e=>y.degToRad(-135+270*Math.min(e,250)/250);T((t,i)=>{n.current&&(n.current.rotation.z=J(n.current.rotation.z,-r(e),5,i))});let i=Array.from({length:10},(e,t)=>2*Math.PI*t/10+.15);return(0,B.jsxs)(`group`,{children:[(0,B.jsx)(X,{pts:Ke,castShadow:!0,receiveShadow:!0,children:(0,B.jsx)($,{brushed:t.brushed})}),(0,B.jsx)(X,{pts:qe,castShadow:!0,receiveShadow:!0,children:(0,B.jsx)($,{brushed:t.brushed})}),i.map(e=>(0,B.jsxs)(`group`,{position:[.76*Math.cos(e),0,.76*Math.sin(e)],children:[(0,B.jsxs)(`mesh`,{position:[0,1.5,0],castShadow:!0,children:[(0,B.jsx)(`cylinderGeometry`,{args:[.035,.035,.56,24]}),(0,B.jsx)($,{})]}),[1.265,1.715].map(e=>(0,B.jsxs)(`mesh`,{position:[0,e,0],castShadow:!0,children:[(0,B.jsx)(`cylinderGeometry`,{args:[.07,.07,.07,6]}),(0,B.jsx)($,{})]},e))]},e)),(0,B.jsxs)(`mesh`,{position:[0,2.05,0],castShadow:!0,children:[(0,B.jsx)(`cylinderGeometry`,{args:[.05,.05,.46,32]}),(0,B.jsx)($,{})]}),(0,B.jsxs)(`mesh`,{position:[0,2.26,0],castShadow:!0,children:[(0,B.jsx)(`cylinderGeometry`,{args:[.085,.085,.1,6]}),(0,B.jsx)($,{})]}),(0,B.jsxs)(`mesh`,{position:[.25,2.1,0],rotation:[0,0,Math.PI/2],castShadow:!0,children:[(0,B.jsx)(`cylinderGeometry`,{args:[.025,.025,.5,24]}),(0,B.jsx)($,{})]}),(0,B.jsxs)(`group`,{position:[.64,2.1,0],children:[(0,B.jsxs)(`mesh`,{rotation:[Math.PI/2,0,0],castShadow:!0,children:[(0,B.jsx)(`cylinderGeometry`,{args:[.19,.19,.09,64]}),(0,B.jsx)($,{})]}),(0,B.jsxs)(`mesh`,{position:[0,0,.046],children:[(0,B.jsx)(`circleGeometry`,{args:[.168,64]}),(0,B.jsx)(`meshStandardMaterial`,{color:`#eceae4`,roughness:.6})]}),Array.from({length:11},(e,t)=>{let n=r(t*25);return(0,B.jsxs)(`mesh`,{position:[.14*Math.sin(n),.14*Math.cos(n),.049],rotation:[0,0,-n],children:[(0,B.jsx)(`boxGeometry`,{args:[.006,t%2?.018:.03,.002]}),(0,B.jsx)(`meshBasicMaterial`,{color:`#15181b`})]},t)}),(0,B.jsxs)(`group`,{ref:n,position:[0,0,.053],rotation:[0,0,-r(e)],children:[(0,B.jsxs)(`mesh`,{position:[0,.045,0],children:[(0,B.jsx)(`boxGeometry`,{args:[.009,.15,.003]}),(0,B.jsx)(`meshBasicMaterial`,{color:`#15181b`})]}),(0,B.jsxs)(`mesh`,{rotation:[Math.PI/2,0,0],children:[(0,B.jsx)(`cylinderGeometry`,{args:[.016,.016,.008,24]}),(0,B.jsx)(`meshBasicMaterial`,{color:`#15181b`})]})]})]})]})}var $e={NaCl:{color:`#f4f4f2`,film:.5},MgO:{color:`#f7f7f7`,film:.36},AlBr3:{color:`#ece6da`,film:.4},HgO:{color:`#8c2408`,film:0}};function et(e){let{jar:t,look:n,active:r,left:i,made:a,T:o}=e,s=(0,M.useMemo)(()=>Ee(.598,.055,2.045),[]),[c,l]=(0,M.useMemo)(()=>[De(s),Oe(s)],[s]);(0,M.useEffect)(()=>()=>{c.dispose(),l.dispose()},[c,l]);let u=(0,M.useRef)(0),d=(0,M.useRef)(0),f=(0,M.useRef)(0),p=(0,M.useRef)(0),m=(0,M.useRef)(null),h=(0,M.useRef)(null),g=e=>t.includes(e),_=(0,M.useMemo)(()=>n.light?.nm?be(n.light.nm):ye(n.light?.K??1500),[n]),v=n.vessel===`crucible`,b=n.vessel===`jar`,x=Object.keys($e).find(e=>e in a),S=(0,M.useMemo)(()=>matchMedia(`(prefers-reduced-motion: reduce)`).matches,[]);T(({clock:e},c)=>{let l=Math.min(c,.05),g=e.elapsedTime,b=s;S||(b.uTime.value+=l);let C=[0,0,0];for(let e of t){let t=Ie[e];if(!t)continue;let n=e===`I`?y.smoothstep(o,330,460):1;for(let r=0;r<3;r++)C[r]+=t[r]*n*(i[e]??1)}let w=b.uAbsorb.value;w.set(J(w.x,C[0],1.1,l),J(w.y,C[1],1.1,l),J(w.z,C[2],1.1,l)),r||(u.current=g);let T=r&&n.light?n.light.power*(n.flash?Math.exp(-(g-u.current)*2.4):1):0,E=S?1:.9+.1*Math.sin(g*13.1)*Math.sin(g*7.3)+.06*Math.sin(g*23);b.uFlame.value=J(b.uFlame.value,T,T?2.6:3.5,l),b.uSmoke.value=J(b.uSmoke.value,r?n.smoke??0:0,r?.9:.5,l),b.uTall.value=n.light?.tall??1,b.uOpen.value=+!!v,b.uFlameCol.value.copy(_),d.current=J(d.current,Math.min(1,b.uFlame.value*1.1)*(v?.9:.8),4,l),b.uStudio.value=1-d.current*.74;let ee=n.lower&&(r||(a.AlBr3??0)>0)?-.42:0;h.current&&(h.current.position.y=J(h.current.position.y,ee,2.2,l)),b.uFlamePos.value.y=v?.2:.74+(h.current?.position.y??0),n.electrodes&&(b.uFlamePos.value.y=1),m.current&&(m.current.intensity=b.uFlame.value*5.5*E,m.current.position.copy(b.uFlamePos.value).y+=.26,m.current.color.copy(_)),f.current=J(f.current,x?a[x]:0,.8,l),p.current=J(p.current,a.H2O??0,.9,l)});let C=t.filter(e=>q[e]),w=g(`Fe`)&&g(`S`),E=e=>v?[0,.045,0]:e===`Br`||e===`Hg`||e===`I`?[0,.052,0]:n.spoon?[0,.665,0]:[C.indexOf(e)?.24:C.length>1?-.24:0,.055,0];return(0,B.jsxs)(B.Fragment,{children:[(0,B.jsx)(Ye,{dim:d}),(0,B.jsx)(Le,{u:s}),(0,B.jsx)(`pointLight`,{ref:m,intensity:0,distance:14,decay:2}),b&&(0,B.jsxs)(B.Fragment,{children:[(0,B.jsx)(Z,{pts:He}),(0,B.jsx)(Z,{pts:Ue}),(0,B.jsx)(Z,{pts:We}),(0,B.jsx)(ze,{}),(0,B.jsxs)(`mesh`,{position:[0,2.1199999999999997,0],castShadow:!0,children:[(0,B.jsx)(`cylinderGeometry`,{args:[.1,.085,.18,48]}),(0,B.jsx)(`meshStandardMaterial`,{color:`#26282a`,roughness:.7})]}),(0,B.jsx)(`mesh`,{material:c,renderOrder:2,layers:K,position:[0,1.0499999999999998,0],children:(0,B.jsx)(`cylinderGeometry`,{args:[.598,.598,1.9899999999999998,64]})}),(0,B.jsx)(`mesh`,{material:l,renderOrder:3,layers:K,position:[0,1.0499999999999998,0],children:(0,B.jsx)(`cylinderGeometry`,{args:[.598,.598,1.9899999999999998,64]})})]}),v&&(0,B.jsxs)(B.Fragment,{children:[(0,B.jsx)(X,{pts:Je,castShadow:!0,receiveShadow:!0,children:(0,B.jsx)(`meshPhysicalMaterial`,{color:`#dedbd4`,roughness:.45,clearcoat:.4,side:2})}),(0,B.jsx)(`mesh`,{material:l,renderOrder:3,layers:K,position:[0,1.0499999999999998,0],children:(0,B.jsx)(`cylinderGeometry`,{args:[.6,.6,1.9899999999999998,64]})})]}),n.vessel===`steel`&&(0,B.jsx)(Qe,{P:e.P}),n.electrodes&&b&&[-.1,.1].map(e=>(0,B.jsxs)(`group`,{children:[(0,B.jsxs)(`mesh`,{position:[e*.35,1.85,0],children:[(0,B.jsx)(`cylinderGeometry`,{args:[.012,.012,1.5,16]}),(0,B.jsx)($,{})]}),(0,B.jsxs)(`mesh`,{position:[e*.35,1.06,0],children:[(0,B.jsx)(`sphereGeometry`,{args:[.02,24,16]}),(0,B.jsx)($,{})]})]},e)),(0,B.jsxs)(`group`,{ref:h,children:[n.spoon&&b&&(0,B.jsxs)(B.Fragment,{children:[(0,B.jsxs)(`mesh`,{position:[0,1.78,0],castShadow:!0,children:[(0,B.jsx)(`cylinderGeometry`,{args:[.018,.018,1.96,24]}),(0,B.jsx)($,{})]}),(0,B.jsxs)(`mesh`,{position:[.1,.81,0],rotation:[0,0,Math.PI/2],children:[(0,B.jsx)(`cylinderGeometry`,{args:[.016,.016,.22,24]}),(0,B.jsx)($,{})]}),(0,B.jsxs)(`mesh`,{position:[0,2.8,0],rotation:[Math.PI/2,0,0],children:[(0,B.jsx)(`torusGeometry`,{args:[.06,.016,16,48]}),(0,B.jsx)($,{})]}),(0,B.jsx)(X,{pts:Ge,castShadow:!0,children:(0,B.jsx)(`meshStandardMaterial`,{color:`#9a9c9e`,metalness:1,roughness:.32,side:2})})]}),n.spoon&&C.filter(e=>![`Br`,`Hg`,`I`].includes(e)).map(e=>(0,B.jsx)(Fe,{kind:q[e],position:E(e),scale:[`S`,`Fe`].includes(e)?.6:.95,left:i[e]??1,T:r?1100:300},e))]}),C.filter(e=>!n.spoon||[`Br`,`Hg`,`I`].includes(e)).map(e=>w&&e===`S`?null:(0,B.jsx)(Fe,{kind:w?`mix`:q[e],position:E(e),scale:1,left:e===`I`?Math.min(i.I??1,1-y.smoothstep(o,345,460)):v?1:i[e]??1,T:v?r&&w?1250:a.CuO||a.Cu2O||r?o:300:300,turn:w?{color:`#14120f`,amount:a.FeS??0}:e===`Cu`?{color:(a.CuO??0)>=(a.Cu2O??0)?`#0c0b0b`:`#8a2417`,amount:Math.max(a.CuO??0,a.Cu2O??0),matte:!0}:void 0},e)),b&&x&&(0,B.jsx)(Xe,{amount:f,color:$e[x].color,film:$e[x].film,radius:.534,y:.053},x),b&&(0,B.jsx)(Ze,{amount:p})]})}function tt(e){let t=e.look.vessel===`crucible`;return(0,B.jsx)(`div`,{role:`img`,"aria-label":e.label,style:{position:`absolute`,inset:0},children:(0,B.jsxs)(ie,{shadows:`percentage`,dpr:[1,1.75],camera:{position:t?[.9,1.75,3.6]:[1.2,2.1,7.2],fov:27,near:.5,far:60},gl:{toneMapping:4,toneMappingExposure:.95,antialias:!1,powerPreference:`high-performance`},children:[(0,B.jsx)(et,{...e}),(0,B.jsx)(ne,{target:[0,t?.2:1.22,0],enablePan:!1,minDistance:2.4,maxDistance:9,minPolarAngle:.5,maxPolarAngle:1.53,minAzimuthAngle:-1.2,maxAzimuthAngle:1.2,enableDamping:!0})]})})}function nt({el:e,T:t,label:n}){let r=!q[e];return(0,B.jsx)(`div`,{role:`img`,"aria-label":n,style:{position:`absolute`,inset:0},children:(0,B.jsxs)(ie,{shadows:`percentage`,dpr:[1,1.75],camera:{position:r||e===`Br`||e===`I`?[1.35,2.15,7.4]:[1.1,1.5,3.1],fov:27,near:.3,far:60},gl:{toneMapping:4,toneMappingExposure:.95,antialias:!1},children:[(0,B.jsx)(et,{jar:[e],look:{vessel:r||e===`Br`||e===`I`?`jar`:`none`},active:!1,left:{},made:{},T:t,P:1,label:n}),(0,B.jsx)(ne,{target:[0,r||e===`Br`||e===`I`?1.22:.18,0],enablePan:!1,minDistance:1.6,maxDistance:9,maxPolarAngle:1.53,enableDamping:!0})]})})}export{nt as SampleStage,tt as Stage};