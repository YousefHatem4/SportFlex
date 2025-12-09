import React from 'react'
import slide1 from '../../assets/Images/1.jpg'
import slide2 from '../../assets/Images/2.jpg'
import slide3 from '../../assets/Images/3.jpg'
import slide4 from '../../assets/Images/4.jpg'

import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

export default function HomeSlider() {
    var settings = {
        dots: false,
        infinite: true,
        speed: 1000,
        slidesToShow: 1,
        slidesToScroll: 1,
        arrows: false,
        autoplay: true,
        autoplaySpeed: 2000,
    };
    return (
        <div>
            <Slider {...settings}>
                <div><img src={slide1} className='w-full h-[320px] object-contain md:object-cover ' alt="slide1" /></div>
                <div><img src={slide2} className='w-full h-[320px]  object-contain  md:object-cover' alt="slide2" /></div>
                <div><img src={slide3} className='w-full h-[320px]  object-contain  md:object-cover' alt="slide3" /></div>
                <div><img src={slide4} className='w-full h-[320px]   object-contain md:object-cover' alt="slide4" /></div>
            </Slider>
        </div>
    );
}
