import { useUser } from "../contexts/UserContext";
import fetchWithTimeout from "../utils/fetcherWithTimeout";
import { Card, HStack, Spinner, VStack, Heading, Wrap, WrapItem } from "@chakra-ui/react"
import { useColorModeValue } from "../components/ui/color-mode";
import { useNavigate, useLocation } from "react-router-dom";




import React, { useEffect, useState } from "react";

const UserCourses = () => {
    const { user } = useUser();
    const [courses, setCourses] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const headerColor = useColorModeValue("teal700", "teal.400");


    const navigate = useNavigate();

    useEffect(() => {
        const fetchCourses = async () => {
            setIsLoading(true);
            const response = await fetchWithTimeout('http://localhost:8000/get_all_courses', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user?.token}`
                }
            });
            const data = await response.json();
            setCourses(data);
            setIsLoading(false);
        };
        fetchCourses();
    }, [user]);

    console.log("courses:", courses);

    return (
        <VStack gap={4}>
            <Heading color={headerColor}>User Courses</Heading>
            <Wrap gap={4}>
                {isLoading ? (
                    <HStack justify="center" align="center" w="100%" h="200px">
                        <p>Loading courses...</p>
                        <Spinner size={"xl"} />
                    </HStack>
                ) : (
                    courses.map(course => (
                        // <WrapItem key={course.id} w={{ base: "100%", sm: "300px" }}>
                        <Card.Root onClick={() => navigate(`/course/${course.id}`)}>
                            <Card.Header>
                                <Card.Title color={headerColor}>{course.title}</Card.Title>
                            </Card.Header>
                            <Card.Footer>
                                <button>Action</button>
                            </Card.Footer>
                        </Card.Root>

                    ))
                )}
            </Wrap>
        </VStack >
    );
}

export default UserCourses;