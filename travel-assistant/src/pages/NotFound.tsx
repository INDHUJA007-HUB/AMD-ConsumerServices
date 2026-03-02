import { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
// import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin'; // Paid plugin
import './NotFound.css';

// gsap.registerPlugin(MorphSVGPlugin);

const NotFound = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  // We can't use MorphSVGPlugin without the paid membership.
  // I will adapt the animation to use standard transforms and opacity changes 
  // to keep the spirit of the "Yeti" 404 page without breaking on missing plugins.

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ repeat: -1, yoyo: true });

      // Simple flashlight effect
      tl.to(['#armL', '#flashlightFront'], { x: 7, duration: 0.075, delay: 2.5 })
        .to(['#armL', '#flashlightFront'], { x: 0, duration: 0.075 })
        .to(['#armL', '#flashlightFront'], { x: 7, duration: 0.075 })
        .to(['#armL', '#flashlightFront'], { x: 0, duration: 0.075 })
        .addLabel("flicker")

        // Toggle light/dark classes simulation (using opacity/visibility)
        .to('#light', { autoAlpha: 1, duration: 0.1 }, "+=0.2")
        .to('#light', { autoAlpha: 0, duration: 0.1 }, "+=0.1")
        .to('#light', { autoAlpha: 1, duration: 0.1 }, "+=0.1")

        // Eye movement
        .to(['#eyeL', '#eyeR'], { scale: 1.4, transformOrigin: "center", duration: 0.25 }, "+=1")
        .to(['#eyeL', '#eyeR'], { scale: 1, transformOrigin: "center", duration: 0.25 }, "+=3")

        // Arm movement
        .to('#armR', { rotation: 10, y: 30, x: 10, transformOrigin: "bottom center", duration: 0.5 }, "flicker+=1")
        .to('#armR', { rotation: 0, y: 0, x: 0, transformOrigin: "bottom center", duration: 0.5 }, "+=3")

        // Final flicker
        .to('#light', { autoAlpha: 0, duration: 0.1 }, "+=0.5")
        .to('#light', { autoAlpha: 1, duration: 0.1 }, "+=0.1")
        .to('#light', { autoAlpha: 0, duration: 0.1 }, "+=0.1")
        .to('#light', { autoAlpha: 1, duration: 0.1 }, "+=0.1")
        .to('#light', { autoAlpha: 0, duration: 0.1 }, "+=0.1");

    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="not-found-container relative min-h-screen bg-[#09334f] overflow-hidden flex items-center justify-center">
      <svg id="yetiSVG" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 470" className="absolute top-0 left-0 w-[600px] h-[470px] overflow-hidden">
        <defs>
          <linearGradient id="flashlightGrad" x1="126.5842" x2="90.5842" y1="176.5625" y2="213.5625" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#333" />
            <stop offset=".076" stopColor="#414141" />
            <stop offset=".2213" stopColor="#555" />
            <stop offset=".3651" stopColor="#626262" />
            <stop offset=".5043" stopColor="#666" />
            <stop offset=".6323" stopColor="#606060" />
            <stop offset=".8063" stopColor="#4e4e4e" />
            <stop offset="1" stopColor="#333" />
          </linearGradient>
          <filter id="white-glow">
            <feFlood result="flood" floodColor="#ffffff" floodOpacity=".6"></feFlood>
            <feComposite in="flood" result="mask" in2="SourceGraphic" operator="in"></feComposite>
            <feMorphology in="mask" result="dilated" operator="dilate" radius="3"></feMorphology>
            <feGaussianBlur in="dilated" result="blurred" stdDeviation="8"></feGaussianBlur>
            <feMerge>
              <feMergeNode in="blurred"></feMergeNode>
              <feMergeNode in="SourceGraphic"></feMergeNode>
            </feMerge>
          </filter>
        </defs>
        <path fill="#24658F" d="M0 0h600v470H0z" />
        <g id="pillow">
          <path fill="#09334F" d="M241.3 124.6c-52.9 28.6-112.6 48-181.8 54.4-40.9 6.8-64.6-82.3-31.9-106.6C84 43.8 144.8 26.2 209.4 18c32.8 13 48.5 75.3 31.9 106.6z" />
          <path fill="none" stroke="#001726" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M52.8 91.3c10 7.4 25.4 50.7 16.1 65.8M241.3 124.6c-52.9 28.6-112.6 48-181.8 54.4-40.9 6.8-64.6-82.3-31.9-106.6C84 43.8 144.8 26.2 209.4 18c32.8 13 48.5 75.3 31.9 106.6z" />
          <path fill="#09334F" stroke="#001726" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M201.9 21.9c4.9-8 14.1-11.3 20.6-7.3s7.7 13.7 2.8 21.7" />
          <path fill="#09334F" stroke="#001726" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M242.1 103.1c1.8.3 3.6.9 5.3 1.8 8.4 4.1 12.6 13 9.3 19.8s-12.9 9-21.3 4.9c-1.9-.9-3.6-2.1-5-3.4" />
          <path fill="#09334F" stroke="#001726" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M70.3 172c.2 1.4.2 2.8.1 4.3-.8 9.4-8.3 16.4-16.7 15.6S39.2 183 40 173.7c.1-1.6.5-3.1 1-4.5" />
          <path fill="#09334F" stroke="#001726" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20.9 85.1c-4.1-5-5.1-11.6-2.1-16.9 4.1-7.2 14-9.2 22.1-4.6 3.7 2.1 6.4 5.2 7.9 8.6" />
        </g>
        <g id="yeti">
          <path id="bodyBG" fill="#67B1E0" d="M80.9 291.4l-17.1-72.8c-6.3-27 10.4-54 37.4-60.3l93.1-29.6c26.5-8.1 54.6 6.8 62.7 33.3l21.9 71.5" />
          <path className="hlFur" id="hlBody" fill="#FFF" d="M67.1 232.7c15.6-8.7 27.7-23.7 38-38.7 5.5-8 10.9-16.4 18.3-22.7 13.1-11.2 31.3-14.8 48.6-15 4.9 0 9.9.1 14.5-1.7 3.6-1.5 6.5-4.1 9.3-6.9 6.5-6.5 12-14 18-21-6.4-.6-12.9 0-19.4 2l-93.1 29.6c-27 6.3-43.7 33.4-37.4 60.3l3.2 14.1z" />
          <path id="bodyOutline" fill="none" stroke="#265D85" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M80.9 291.4l-17.1-72.8c-6.3-27 10.4-54 37.4-60.3l93.1-29.6c26.5-8.1 54.6 6.8 62.7 33.3l21.9 71.5" />
          <path fill="#67B1E0" d="M197.5 132.4l-11.2-47.9c-6.3-26.7-32.7-44.1-59.5-38.2-27.4 6-44.5 33.1-38.1 60.3l13.6 56.2" />
          <path className="hlFur" id="hlHead" fill="#FFF" d="M100.4 132.3l7.4 29.8 89.7-28.8-11.4-48.9c-1.6-6.8-4.5-12.9-8.4-18.3-9.6-7.9-28.5-12.9-46.9-8.5-24.9 5.9-34.5 23.6-38.1 37.9-.8.8-3.8 3-5.1 5.4.2 1.9.5 3.7 1 5.6l7 28.8 4.8-3z" />
          <path fill="#67B1E0" stroke="#265D85" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M182.1 71.6c3.8 3.6 7 7.7 9.5 12-1.8.4-3.6.9-5.3 1.6 3.2 2.9 5.7 6.3 7.6 9.9-1.1.3-2.2.7-3.3 1.1 2.5 3.5 4.3 7.4 5.4 11.5-.8-.5-2.2-.8-3.3-1" />
          <path fill="none" stroke="#265D85" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M197.5 132.4l-11.2-47.9c-6.3-26.7-32.7-44.1-59.5-38.2-27.4 6-44.5 33.1-38.1 60.3l13.6 56.2" />
          <g>
            <ellipse cx="85.8" cy="120.4" fill="#88C9F2" rx="11.5" ry="11.5" transform="rotate(-66.265 85.7992 120.4318)" />
            <path className="hlSkin" id="hlEar" fill="#DDF1FA" d="M80.4 122.2c-1.3-5.5 1.6-11.1 6.6-13.2-1.3-.1-2.6-.1-3.9.3-6.2 1.5-10 7.7-8.5 13.9s7.7 10 13.9 8.5c.7-.2 1.3-.4 1.9-.6-4.7-.6-8.9-4-10-8.9z" />
            <path fill="#88C9F2" stroke="#265D85" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M84.2 116.6c-2.2.5-3.6 2.8-3 5 .5 2.2 2.8 3.6 5 3" />
            <ellipse cx="85.8" cy="120.4" fill="none" stroke="#265D85" strokeWidth="2.5" rx="11.5" ry="11.5" transform="rotate(-66.265 85.7992 120.4318)" />
            <path className="hlFur" fill="#FFF" d="M106 130.3l-12 3.6 1.2-11.4-6.3-.1 6-12h-5.4l9.6-8.4z" />
            <path className="hlFur" fill="#FFF" stroke="#265D85" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M92.1 96.4c-5.1 5.9-8.4 11.7-10 17 4.2-1.2 8.5-2.2 12.8-3-4.2 4.8-6.7 9.5-7.6 13.8 2.7-.7 5.4-1.3 8-1.7-2.3 4.8-2.8 9.2-1.7 13.3 1.4-1 4-2.4 6.1-3.4" />
          </g>
          <path className="hlSkin" id="face" fill="#DDF1FA" d="M169.1 70.4l7.3 23.4c9.4 26.8-1.8 45-20 50.7s-37.8-5.1-45.8-30.1L103.3 91" />
          <path id="chin" fill="none" stroke="#265D85" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M152.4 147.5c3.8 1 8 1.4 12.3 1.1-.5-1.4-1-2.9-1.6-4.3 3.8.6 7.9.7 12.1.1l-3.3-4.8c3.1-.6 6.3-1.6 9.5-3.1-1.4-1.6-2.8-3.1-4.2-4.6" />
          <path className="hlFur" id="eyebrow" fill="#FFF" stroke="#265D85" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M100.9 89.8c7.6 3.5 15.9 6.1 24.7 7.7 1.1-3.3 2.1-6.6 3-9.9 5.5 2.3 11.3 4.1 17.5 5.4.2-3.3.4-6.5.4-9.7 4.5.7 9.2 1.1 14 1.1-.5-3.4-1.1-6.7-1.7-10 4.5-1.9 9-4.2 13.3-6.9" />
          <g id="eyeL">
            <circle cx="135.9" cy="105.3" r="3.5" fill="#265D85" />
            <circle cx="133.7" cy="103.5" r="1" fill="#FFF" />
          </g>
          <g id="eyeR">
            <circle cx="163.2" cy="96.3" r="3.5" fill="#265D85" />
            <circle cx="160.9" cy="94.5" r="1" fill="#FFF" />
          </g>
          <path id="nose" fill="#265D85" d="M149.3 101.2l4.4-1.6c1.8-.6 3.6 1 3.1 2.9l-1.1 3.9c-.4 1.6-2.3 2.2-3.6 1.3l-3.3-2.3c-1.7-1.1-1.3-3.5.5-4.2z" />
          <path fill="#67B1E0" stroke="#265D85" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M112.4 55.9c.9-4.3 3.8-9.2 8.8-13.7 1.4 2.3 2.8 4.7 4.1 7.1 2.3-4.8 6.9-9.8 13.8-14.1-.1 3.4-.3 6.8-.6 10.1 4.4-3 10.2-5.7 17.3-7.6-1.7 3.6-3.7 7.2-5.9 10.8" />
          <g id="mouth">
            <path id="mouthBG" fill="#265D85" d="M149 115.7c-4.6 3.7-6.6 9.8-5 15.6.1.5.3 1.1.5 1.6.6 1.5 2.4 2.3 3.9 1.7l11.2-4.4 11.2-4.4c1.5-.6 2.3-2.4 1.7-3.9-.2-.5-.4-1-.7-1.5-2.8-5.2-8.4-8.3-14.1-7.9-3.7.2-5.9 1.1-8.7 3.2z" />
          </g>
          <g id="armR">
            <path className="hlSkin" fill="#DDF1FA" d="M158.4 116.9l-.7.3c-3.7 1.5-5.5 5.7-4.1 9.4l1.2 2.9c1.7 4.4 6.7 6.5 11.1 4.8l1.4-.5" />
            <path fill="#A9DDF3" d="M154.8 129.1l.7 1.8c1 2.5 5.4 3.1 5.4 3.1l-2-5.1c-.3-.7-1.1-1.1-1.8-.8l-2.3 1z" />
            <path fill="none" stroke="#265D85" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="2.5" d="M158.4 116.9l-.7.3c-3.7 1.5-5.5 5.7-4.1 9.4l1.2 2.9c1.7 4.4 6.7 6.5 11.1 4.8l1.4-.5" />
            <path className="hlSkin" fill="#DDF1FA" stroke="#265D85" strokeWidth="2.5" d="M167.7 113.2l-.7.3c-3.7 1.5-5.5 5.7-4.1 9.4l1.2 2.9c1.7 4.4 6.7 6.5 11.1 4.8l1.4-.5" />
            <path className="hlSkin" fill="#DDF1FA" stroke="#265D85" strokeWidth="2.5" d="M177 109.4l-.7.3c-3.7 1.5-5.5 5.7-4.1 9.4l1.2 2.9c1.7 4.4 6.7 6.5 11.1 4.8l1.4-.5" />
            <path fill="#88C9F2" d="M162.3 128.6l18.6 46.7 37.2-14.8-17.9-44.8" />
            <path className="hlSkin" fill="#DDF1FA" d="M206.5 130.7l-5.9-15.1-37.9 13 6.4 17.4c10 1.6 34.6-6.3 37.4-15.3z" />
            <path fill="none" stroke="#265D85" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="2.5" d="M162.3 128.6l18.6 46.7 37.2-14.8-15.3-38.3" />
            <path className="hlSkin" fill="#DDF1FA" d="M190.8 119l-1.5-3.7c-2-5.1-7.9-7.6-13-5.6l5.2 12.9" />
            <path className="hlSkin" fill="#DDF1FA" d="M203.5 123.8l-1.5-3.7c-2-5.1-7.9-7.6-13-5.6l5.2 12.9" />
            <path fill="#A9DDF3" d="M200.4 119.4l-.7-1.8c-1-2.5-5.4-3.1-5.4-3.1l1.9 4.8c.3.8 1.3 1.3 2.1.9l2.1-.8z" />
            <path fill="none" stroke="#265D85" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="2.5" d="M203.5 123.8l-1.5-3.7c-2-5.1-7.9-7.6-13-5.6" />
            <path fill="none" stroke="#265D85" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="2.5" d="M193.7 126.4l-4.4-11.1c-2-5.1-7.9-7.6-13-5.6" />
            <path fill="#67B1E0" d="M219.6 160.1c-1.5-6.2-3.2-13.2-5.1-21.1-2.8 2.1-5.6 4.5-8.3 7.4-2-1.8-4.1-3.7-6.2-5.7-2.4 3.6-4.6 7.7-6.7 12.1-3-1.9-6-3.9-9.2-6-1.4 2.9-2.7 6-4 9.2-4.7-.6-9.4-1.1-14.2-1.7 5.4 8 10.3 15.2 14.7 21.5" />
            <path fill="none" stroke="#265D85" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M219.6 160.1c-1.5-6.2-3.2-13.2-5.1-21.1-2.8 2.1-5.6 4.5-8.3 7.4-2-1.8-4.1-3.7-6.2-5.7-2.4 3.6-4.6 7.7-6.7 12.1-3-1.9-6-3.9-9.2-6-1.4 2.9-2.7 6-4 9.2-4.7-.6-9.4-1.1-14.2-1.7 5.4 8 10.3 15.2 14.7 21.5" />
            <path fill="none" stroke="#3A5E77" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="2.5" d="M160.9 125l2 5.1" />
            <path className="hlSkin" fill="#DDF1FA" d="M172.2 126.4l-1.5-3.7c-2-5.1-7.9-7.6-13-5.6l5.2 12.9" />
            <path fill="none" stroke="#265D85" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="2.5" d="M160.5 124l2.4 6.1" />
            <path className="hlSkin" fill="#DDF1FA" d="M181.5 122.7L180 119c-2-5.1-7.9-7.6-13-5.6l5.2 12.9" />
            <path fill="none" stroke="#265D85" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="2.5" d="M181.5 122.7L180 119c-2-5.1-7.9-7.6-13-5.6" />
            <path fill="none" stroke="#265D85" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="2.5" d="M172.2 126.4l-1.5-3.7c-2-5.1-7.9-7.6-13-5.6" />
          </g>
          <g id="armL">
            <path fill="#67B1E0" d="M50.9 156.7c-12 35.8-7.8 69.6 8.3 101.9 12.1 22.7 37 14.1 39.5-11.8v-65l-47.8-25.1z" />
            <path fill="none" stroke="#265D85" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M50.9 156.7c-12 35.8-7.8 69.6 8.3 101.9 10 22.3 37.3 15.1 39.5-11.8v-65l-47.8-25.1z" />
            <path fill="none" stroke="#262626" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="20" d="M59.3 143.8l34.3 33.9" />
            <path fill="#4D4D4D" d="M58.4 133.9l15.9 15.9-.9.9-16.5-16.5c.5-.2 1-.3 1.5-.3z" />
            <path fill="#1A1A1A" d="M71.2 169.6l-20.1-20c-2.4-3.7-2.5-8.1.1-11.7l23.1 22.2" />
            <path fill="#4D4D4D" d="M80.5 156.4l16 15.9-.9.9-16.5-16.5c.5-.1 1-.2 1.4-.3z" />
            <path fill="#1A1A1A" d="M74.2 160.1L86 171.4l-2 11-10.2-10.1c-2.4-4.4-2.5-8.5.4-12.2z" />
            <path fill="#88C9F2" d="M65.9 164.8c-1.9-5.5.8-11.8 6.1-14.1 4.9-2.2 10.4-.6 13.5 3.4 1.3 1.6 3.5 2.1 5.4 1.4 3-1.2 3.9-4.9 1.9-7.4-5.8-7.2-16.1-9.9-25-5.7-9.4 4.4-14.1 15.3-10.9 25.2" />
            <path fill="none" stroke="#265D85" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M67.9 168.3c-1.1-1.2-2-3.6-2-3.6-1.9-5.5.8-11.8 6.1-14.1 4.9-2.2 10.4-.6 13.5 3.4 1.3 1.6 3.5 2.1 5.4 1.4 3-1.2 3.9-4.9 1.9-7.4-5.8-7.2-16.1-9.9-25-5.7-9.4 4.4-14.1 15.3-10.9 25.2" />
            <path fill="#88C9F2" d="M69.9 168.7c-1.9-5.5.8-11.8 6.1-14.1 4.9-2.2 10.4-.6 13.5 3.4 1.3 1.6 3.5 2.1 5.4 1.4 3-1.2 3.9-4.9 1.9-7.4-5.8-7.2-16.1-9.9-25-5.7-9.4 4.4-14.1 15.3-10.9 25.2" />
            <path fill="#67B1E0" d="M49.9 155l2.7 12.7.2 11.8 5 8.6 9.5-1.8 2-8.7-6.9.6 1.7-11.7-6.6 2.8 1-13.8-4.6 2.9z" />
            <path fill="none" stroke="#265D85" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M71.9 172.3c-1.1-1.2-2-3.6-2-3.6-1.9-5.5.8-11.8 6.1-14.1 4.9-2.2 10.4-.6 13.5 3.4 1.3 1.6 3.5 2.1 5.4 1.4 3-1.2 3.9-4.9 1.9-7.4-5.8-7.2-16.1-9.9-25-5.7" />
            <path className="hlSkin" id="hlHandL" fill="#DDF1FA" d="M101.7 156.9c-5.8-7.2-16.1-9.9-25-5.7-5.9 2.8-9.9 8.1-11.3 14.1l-1-.9-6.2 4.2c5.5 18.1 19.3 25.4 30.4 21l1.2-9.1c-6 2.4-12.7-.7-14.9-6.8-1.9-5.5.8-11.8 6.1-14.1 4.9-2.2 10.4-.6 13.5 3.4 1.3 1.6 3.5 2.1 5.4 1.4 2.9-1.3 3.8-5 1.8-7.5z" />
            <path fill="none" stroke="#265D85" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M89.7 180.5c-6 2.4-12.7-.7-14.9-6.8" />
            <path fill="none" stroke="#265D85" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M76.9 177.3c-1.1-1.2-2-3.6-2-3.6-1.9-5.5.8-11.8 6.1-14.1 4.9-2.2 10.4-.6 13.5 3.4 1.3 1.6 3.5 2.1 5.4 1.4 3-1.2 3.9-4.9 1.9-7.4-5.8-7.2-16.1-9.9-25-5.7" />
            <path className="hlFur" id="hlArmL" fill="#FFF" d="M98.8 202.8l-1.4-8.7-5.2.7-7.2-11.5-6.8 9-3.9-9.3-7.5 4.8 3.5-11.4-7.1 1.9 2.7-13.5-7.8 4.9c-11.7 26.5-3.6 52.5 1.7 66.6 15.5-6.4 30.3-21.9 39-33.5z" />
            <path fill="#A9DDF3" d="M101 161.2l-2.4-2.2c.2-1.6-.2-2.7-.8-3.9l2.6 2.5c.8.8 1 2.2.6 3.6z" />
            <path fill="none" stroke="#265D85" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M66.9 187.8l3.5-11.4-7.2 1.9 2.6-13.9-7.5 4.5 1.2-15.5-5.5 4.2" />
            <path fill="none" stroke="#265D85" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M54 157.6l-5.6-5.6 2.7 14.7" />
            <path fill="none" stroke="#265D85" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M67.1 188l7.3-5 3.8 9.3" />
            <path fill="none" stroke="#265D85" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M78.2 192.3l6.8-9 7.1 11.5" />
          </g>
        </g>
        <g id="flashlightFront">
          <path fill="#1A1A1A" d="M83.9 181.4l4.6 26.4 34.6-33.6-24.5-6.2c-8.9-2.6-16.6 3.9-14.7 13.4z" />
          <path fill="#333" d="M91.9 167.8l20.5 7.4-.5 1.2-21.4-8.2c.5-.2 1-.3 1.4-.4z" />
          <path d="M86 171.4c-2 2.5-3 6-2.2 10l4.6 26.4 11.4-11.1L86 171.4z" />
          <path fill="url(#flashlightGrad)" d="M99.1 183.7c-10.6 9.4-13.4 21.4-9 28.5 4.3 6.8 18 3 28.6-6.4s14.9-23.7 8.8-29c-6.9-6.1-17.8-2.6-28.4 6.9z" />
          <path fill="#B3B3B3" d="M101.6 185.7c-8.2 7.3-11.9 18.2-8.8 23.1 2.6 4.1 13.6-1.1 21.8-8.4s13.6-18.1 9.9-21.6c-4.4-4.2-14.7-.4-22.9 6.9z" />
        </g>
      </svg>

      <div id="light" className="absolute top-0 left-0 w-[600px] h-[470px] pointer-events-none" style={{ visibility: 'hidden' }}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 470" className="w-full h-full">
          <path filter="url(#white-glow)" fill="#F8FFE8" d="M122.2 177.4c-5.2-1.6-13.6 2.1-20.6 8.3-7.7 6.8-11.4 16.8-9.3 22.1L421 1683h1534V733L122.2 177.4z" />
        </svg>
      </div>

      <div className="content relative z-10 text-white font-sans pl-[25rem] pr-12 pt-20">
        <h3 className="text-4xl font-extrabold mb-3">Hello?? Is somebody there?!?</h3>
        <p className="text-xl font-normal text-[#d1e2ed] leading-relaxed">
          We know it’s scary, but the page you’re trying to reach can’t be found. Perhaps it was just a bad <span className="line-through">link</span> dream?
        </p>
        <Link to="/" className="mt-8 inline-block px-6 py-3 bg-[#4F9CF9] text-white rounded-lg hover:bg-[#3bf] transition-colors font-bold">Return Home</Link>
      </div>
    </div>
  );
};

export default NotFound;
