// src/Routes/Tv.tsx

import { useQuery } from "@tanstack/react-query";
import {
  getAiringTodayTvShows,
  getTopRatedTvShows,
  getPopularTvShows,
  IGetTvShowsResult,
} from "../api";
import styled from "styled-components";
import { makeImagePath } from "../utils";
import { AnimatePresence, motion, useScroll } from "framer-motion";
import { useState } from "react";
import { PathMatch, useMatch, useNavigate } from "react-router-dom";

// 스타일 정의
const Wrapper = styled.div`
  background-color: black;
  padding-bottom: 200px;
`;

const Loader = styled.div`
  height: 20vh;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const Banner = styled.div<{ bgphoto: string }>`
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 60px;
  background-image: linear-gradient(rgba(0, 0, 0, 0), rgba(0, 0, 0, 1)),
    url(${(props) => props.bgphoto});
  background-size: cover;
`;

const Title = styled.h2`
  font-size: 68px;
  margin-bottom: 20px;
  color: white;
`;

const Overview = styled.p`
  font-size: 36px;
  width: 50%;
  color: white;
`;

const NextButton = styled.button`
  margin-top: 20px;
  padding: 10px 20px;
  font-size: 20px;
  background-color: rgba(255, 255, 255, 0.7);
  color: black;
  border: none;
  cursor: pointer;
  z-index: 10;
  position: relative;
  &:hover {
    background-color: rgba(255, 255, 255, 1);
  }
`;

const SliderTitle = styled.h3`
  font-size: 24px;
  color: white;
  margin-left: 20px;
`;

const Slider = styled.div`
  position: relative;
  margin-bottom: 200px;
  top: -100px;
  z-index: 0;
`;

const Row = styled(motion.div)`
  display: grid;
  gap: 5px;
  grid-template-columns: repeat(6, 1fr);
  position: absolute;
  width: 100%;
  z-index: 1;
`;

const Box = styled(motion.div)<{ bgphoto: string }>`
  background-color: white;
  background-image: url(${(props) => props.bgphoto});
  background-size: cover;
  background-position: center center;
  height: 200px;
  font-size: 66px;
  cursor: pointer;
  &:first-child {
    transform-origin: center left;
  }
  &:last-child {
    transform-origin: center right;
  }
`;

const Info = styled(motion.div)`
  padding: 10px;
  background-color: ${(props) => props.theme.black.lighter};
  opacity: 0;
  position: absolute;
  width: 100%;
  bottom: 0;
  h4 {
    text-align: center;
    font-size: 18px;
    color: white;
  }
`;

const Overlay = styled(motion.div)`
  position: fixed;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  opacity: 0;
`;

const BigTvShow = styled(motion.div)`
  position: absolute;
  width: 40vw;
  height: 80vh;
  left: 0;
  right: 0;
  margin: 0 auto;
  border-radius: 15px;
  overflow: hidden;
  background-color: ${(props) => props.theme.black.lighter};
`;

const BigCover = styled.div`
  width: 100%;
  background-size: cover;
  background-position: center center;
  height: 400px;
`;

const BigTitle = styled.h3`
  color: ${(props) => props.theme.white.lighter};
  padding: 20px;
  font-size: 46px;
  position: relative;
  top: -80px;
`;

const BigOverview = styled.p`
  padding: 20px;
  position: relative;
  top: -80px;
  color: ${(props) => props.theme.white.lighter};
`;

const rowVariants = {
  hidden: (direction: number) => ({
    x: direction > 0 ? window.outerWidth : -window.outerWidth,
  }),
  visible: {
    x: 0,
    transition: { type: "tween", duration: 1 },
  },
  exit: (direction: number) => ({
    x: direction < 0 ? window.outerWidth : -window.outerWidth,
    transition: { type: "tween", duration: 1 },
  }),
};

const boxVariants = {
  normal: {
    scale: 1,
  },
  hover: {
    scale: 1.3,
    y: -80,
    transition: {
      delay: 0.5,
      duration: 0.1,
      type: "tween",
    },
  },
};

const infoVariants = {
  hover: {
    opacity: 1,
    transition: {
      delay: 0.5,
      duration: 0.1,
      type: "tween",
    },
  },
};

const offset = 6;

function Tv() {
  const navigate = useNavigate();
  const bigTvShowMatch: PathMatch<string> | null = useMatch("/tv/:tvShowId");
  const { scrollY } = useScroll();

  // 각 TV 데이터를 받아옴
  const { data: airingTodayData, isLoading: airingTodayLoading } =
    useQuery<IGetTvShowsResult>({
      queryKey: ["tv", "airingToday"],
      queryFn: getAiringTodayTvShows,
    });

  const { data: topRatedData, isLoading: topRatedLoading } =
    useQuery<IGetTvShowsResult>({
      queryKey: ["tv", "topRated"],
      queryFn: getTopRatedTvShows,
    });

  const { data: popularData, isLoading: popularLoading } =
    useQuery<IGetTvShowsResult>({
      queryKey: ["tv", "popular"],
      queryFn: getPopularTvShows,
    });

  // 각 슬라이더에 대한 개별 인덱스 상태
  const [airingTodayIndex, setAiringTodayIndex] = useState(0);
  const [topRatedIndex, setTopRatedIndex] = useState(0);
  const [popularIndex, setPopularIndex] = useState(0);

  const [leaving, setLeaving] = useState(false);
  const [direction, setDirection] = useState(1); // 슬라이딩 방향

  const incraseIndex = (
    setIndex: React.Dispatch<React.SetStateAction<number>>,
    dataLength: number
  ) => {
    if (dataLength) {
      if (leaving) return;
      toggleLeaving();
      setDirection(1);
      const totalItems = dataLength - 1;
      const maxIndex = Math.floor(totalItems / offset) - 1;
      setIndex((prev) => (prev === maxIndex ? 0 : prev + 1));
    }
  };

  const toggleLeaving = () => setLeaving((prev) => !prev);

  const onBoxClicked = (tvShowId: number) => {
    navigate(`/tv/${tvShowId}`);
  };

  const onOverlayClick = () => navigate(-1);

  const clickedTvShow =
    bigTvShowMatch?.params.tvShowId &&
    (airingTodayData?.results.find(
      (tvShow) => tvShow.id + "" === bigTvShowMatch.params.tvShowId
    ) ||
      topRatedData?.results.find(
        (tvShow) => tvShow.id + "" === bigTvShowMatch.params.tvShowId
      ) ||
      popularData?.results.find(
        (tvShow) => tvShow.id + "" === bigTvShowMatch.params.tvShowId
      ));

  return (
    <Wrapper>
      {airingTodayLoading || topRatedLoading || popularLoading ? (
        <Loader>Loading...</Loader>
      ) : (
        <>
          {/* 배너 */}
          <Banner
            bgphoto={makeImagePath(
              airingTodayData?.results[0].backdrop_path || ""
            )}
          >
            <Title>{airingTodayData?.results[0].name}</Title>
            <Overview>{airingTodayData?.results[0].overview}</Overview>
          </Banner>

          {/* Airing Today 슬라이더 */}
          <Slider>
            <SliderTitle>Airing Today</SliderTitle>
            <AnimatePresence
              initial={false}
              custom={direction}
              onExitComplete={toggleLeaving}
            >
              <Row
                variants={rowVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                custom={direction}
                key={airingTodayIndex}
              >
                {airingTodayData?.results
                  .slice(1)
                  .slice(
                    offset * airingTodayIndex,
                    offset * airingTodayIndex + offset
                  )
                  .map((tvShow) => (
                    <Box
                      layoutId={tvShow.id + ""}
                      key={tvShow.id}
                      whileHover="hover"
                      initial="normal"
                      variants={boxVariants}
                      onClick={() => onBoxClicked(tvShow.id)}
                      transition={{ type: "tween" }}
                      bgphoto={makeImagePath(tvShow.backdrop_path, "w500")}
                    >
                      <Info variants={infoVariants}>
                        <h4>{tvShow.name}</h4>
                      </Info>
                    </Box>
                  ))}
              </Row>
            </AnimatePresence>
            <NextButton
              onClick={() =>
                incraseIndex(
                  setAiringTodayIndex,
                  airingTodayData?.results.length || 0
                )
              }
            >
              다음 페이지
            </NextButton>
          </Slider>

          {/* Top Rated 슬라이더 */}
          <Slider>
            <SliderTitle>Top Rated</SliderTitle>
            <AnimatePresence
              initial={false}
              custom={direction}
              onExitComplete={toggleLeaving}
            >
              <Row
                variants={rowVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                custom={direction}
                key={topRatedIndex}
              >
                {topRatedData?.results
                  .slice(1)
                  .slice(
                    offset * topRatedIndex,
                    offset * topRatedIndex + offset
                  )
                  .map((tvShow) => (
                    <Box
                      layoutId={tvShow.id + ""}
                      key={tvShow.id}
                      whileHover="hover"
                      initial="normal"
                      variants={boxVariants}
                      onClick={() => onBoxClicked(tvShow.id)}
                      transition={{ type: "tween" }}
                      bgphoto={makeImagePath(tvShow.backdrop_path, "w500")}
                    >
                      <Info variants={infoVariants}>
                        <h4>{tvShow.name}</h4>
                      </Info>
                    </Box>
                  ))}
              </Row>
            </AnimatePresence>
            <NextButton
              onClick={() =>
                incraseIndex(
                  setTopRatedIndex,
                  topRatedData?.results.length || 0
                )
              }
            >
              다음 페이지
            </NextButton>
          </Slider>

          {/* Popular 슬라이더 */}
          <Slider>
            <SliderTitle>Popular TV Shows</SliderTitle>
            <AnimatePresence
              initial={false}
              custom={direction}
              onExitComplete={toggleLeaving}
            >
              <Row
                variants={rowVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                custom={direction}
                key={popularIndex}
              >
                {popularData?.results
                  .slice(1)
                  .slice(offset * popularIndex, offset * popularIndex + offset)
                  .map((tvShow) => (
                    <Box
                      layoutId={tvShow.id + ""}
                      key={tvShow.id}
                      whileHover="hover"
                      initial="normal"
                      variants={boxVariants}
                      onClick={() => onBoxClicked(tvShow.id)}
                      transition={{ type: "tween" }}
                      bgphoto={makeImagePath(tvShow.backdrop_path, "w500")}
                    >
                      <Info variants={infoVariants}>
                        <h4>{tvShow.name}</h4>
                      </Info>
                    </Box>
                  ))}
              </Row>
            </AnimatePresence>
            <NextButton
              onClick={() =>
                incraseIndex(setPopularIndex, popularData?.results.length || 0)
              }
            >
              다음 페이지
            </NextButton>
          </Slider>

          <AnimatePresence>
            {bigTvShowMatch ? (
              <>
                <Overlay
                  onClick={onOverlayClick}
                  exit={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                />
                <BigTvShow
                  style={{ top: scrollY.get() + 100 }}
                  layoutId={bigTvShowMatch.params.tvShowId}
                >
                  {clickedTvShow && (
                    <>
                      <BigCover
                        style={{
                          backgroundImage: `linear-gradient(to top, black, transparent), url(${makeImagePath(
                            clickedTvShow.backdrop_path,
                            "w500"
                          )})`,
                        }}
                      />
                      <BigTitle>{clickedTvShow.name}</BigTitle>
                      <BigOverview>{clickedTvShow.overview}</BigOverview>
                    </>
                  )}
                </BigTvShow>
              </>
            ) : null}
          </AnimatePresence>
        </>
      )}
    </Wrapper>
  );
}

export default Tv;
